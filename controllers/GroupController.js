import Group from '../models/Group.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose'; //
import cloudinary from '../config/cloudinary.js'; // 
import Post from '../models/PostModel.js';

// GET all groups
// אקספורט מאפשר לייצא את הפונקציה שיהיה ניתן להשתמש בה גם בקבצים אחרים כמו בראוטס וכו

export const getAllGroups = async (req, res) => {// פונקציה אסינכרונית שמקבלת את כל הקבוצות בקשה ותשובה
    try {
        const groups = await Group.find().populate('creator', 'name'); //  מחזיר גם את שם היוצר של הקבוצה 
        res.json(groups);// להחזיר בפורמט של ג'ייסון 
    } catch (error) {
        res.status(500).json({ message: error.message });//אם לא יכול להביא את הקבוצות
    }
};

// GET single group by ID
export const getGroupById = async (req, res) => { //  לקבל קבוצה לפי המזהה יש פה את הבקשה ומה שמחזיר ללקוח 
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {//  ואלידציה שהפורמט של מזהה הקבוצה תקין ולא סתם מחרוזת
            return res.status(400).json({ message: 'Invalid group ID format' });//  להחזיר בגייסון הערה שאיננו תקין
        }

        const group = await Group.findById(req.params.id)
            .populate('creator', 'name')// משלים את הבאת הדאטה מקולקשן של קבוצות ומחזיר את שמו מקולקשן אחר 
            .populate('members', 'name')//כנל
            .populate('pendingRequests.userId', 'email');//כנל

        if (!group) { //אם לא מוצא קבוצה 
            return res.status(404).json({ message: 'Group not found' });// הערה שלא נמצאה הקבוצה 
        }

        // Get all userIds from pendingRequests
        const userIds = group.pendingRequests//  מערך של בקשות הצטרפות 
            .map(req => req.userId?._id?.toString() || req.userId?.toString())//  לפעמים המערך כבר מלא מאחר ועשינו פופיוליט ולפעמים לא לכן סטרינג
            .filter(Boolean);//  מסנן תוצאות ריקות 

        // Fetch UserInfo for all userIds
        const userInfos = await UserInfo.find({ userId: { $in: userIds } }); // מחפש את המידע לפי המזהה של היוזר בתוך הסוגריים סינטקס של מונגו

        // Map userId to UserInfo
        const userInfoMap = {};// מכינים מילון שבו המזהה של היוזר הוא המפתח 
        userInfos.forEach(info => { // לעבור על כל המידע שקיבלנו מהיוזראינפו ולהכניס למילון
            userInfoMap[info.userId.toString()] = info;
        });

        // Build a new array for pendingRequests with UserInfo fields and displayName 
        const enrichedPendingRequests = group.pendingRequests.map(req => { // מעשירה את המידע שיש על כל יוזר במערך ע"י האובייקט רק
            const id = req.userId?._id?.toString() || req.userId?.toString();// לקבל את המזהה בין הוא אובייקט או סטרינג
            const info = userInfoMap[id];// שולפים את מסמך היוזר אינפו לפי המזהה
            const firstName = info?.first_name || '';// אם קיים שם ניקח אותו, אחרת ריק 
            const lastName = info?.last_name || '';
            const displayName = (firstName || lastName)// אם יש שם משפחה ופרטי נחבר אותם אם לא אז אימייל ואחרת 
                ? `${firstName} ${lastName}`.trim()
                : req.userId?.email || 'Unknown User';
            return {
                ...req.toObject(),// תחזיר את האובייקט
                userId: {
                    ...(req.userId?.toObject ? req.userId.toObject() : req.userId),
                    first_name: firstName,
                    last_name: lastName,
                    profilePicture: info?.profilePicture || '',
                    displayName
                }
            };
        });

        // חזרה לפרונט!! את כל פרטי הקבוצה 
        res.json({
            ...group.toObject(),// ממירים לאובייקט רגיל כדי שנוכל להעביר לגייסון -לפני חוזר אלינו כאובייקט של מונגו 
            pendingRequests: enrichedPendingRequests// מחליפים את המערך המקורי בזה שיצרנו
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST create new group
export const createGroup = async (req, res) => {  // יצירת קבוצה חדשה
    console.log('POST /api/groups received:', req.body);

    try {
        const { name, description, image, isPrivate, userId } = req.body; // הכנסה את הפרמטרים לגוף האובייקט 

        // Check if group name already exists
        const existingGroup = await Group.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });// בדיקה לפי סינטקס של מונגו אם קיים שם קבוצה כזה
        if (existingGroup) {
            return res.status(400).json({ message: 'A group with this name already exists' }); //להחזיר הודעת שגיאה 
        }

        const newGroup = new Group({// אחרת יצירת קבוצה חדשה
            name,
            description,
            image,
            isPrivate: isPrivate || false,// שקר זה אומר ציבורי 
            creator: userId || null,
            members: userId ? [userId] : [],// מערך של משתתפים או ריק או היוצר עצמו 
            memberCount: userId ? 1 : 0
        });

        await newGroup.save();// שמירת הקבוצה

        // Add groupId to creator's followingGroups if not already present
        if (userId) {
            const userInfo = await UserInfo.findOne({ userId });
            if (userInfo && !userInfo.followingGroups.includes(newGroup._id)) {
                userInfo.followingGroups.push(newGroup._id);
                await userInfo.save();
            }
        }

        // Return populated group
        const populatedGroup = await Group.findById(newGroup._id)
            .populate('creator', 'name')
            .populate('members', 'name');

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.log('Error saving group:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// PUT update group
export const updateGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const { name, description, image, isPrivate, userId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can update this group' });
        }

        // Check if new name already exists
        if (name && name !== group.name) {
            const existingGroup = await Group.findOne({
                name: { $regex: `^${name}$`, $options: 'i' },
                _id: { $ne: groupId }
            });
            if (existingGroup) {
                return res.status(400).json({ message: 'A group with this name already exists' });
            }
        }

        // Update fields
        if (name !== undefined) group.name = name;
        if (description !== undefined) group.description = description;
        if (image !== undefined) group.image = image;
        if (isPrivate !== undefined) group.isPrivate = isPrivate;

        await group.save();

        const updatedGroup = await Group.findById(groupId)
            .populate('creator', 'name')
            .populate('members', 'name');

        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Replace your deleteGroup function with this debug version temporarily
export const deleteGroup = async (req, res) => {

    try {
        const groupId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID format' });
        }

        const { userId } = req.body;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is the creator
        if (userId && group.creator && !group.creator.equals(userId)) {
            return res.status(403).json({ message: 'Only the group creator can delete this group' });
        }

        // Remove groupId from followingGroups for all members and creator
        const memberIds = group.members.map(id => id.toString());
        if (group.creator && !memberIds.includes(group.creator.toString())) {
            memberIds.push(group.creator.toString());
        }
        await UserInfo.updateMany(
            { userId: { $in: memberIds }, followingGroups: group._id },
            { $pull: { followingGroups: group._id } }
        );

        // 1. Delete all Cloudinary images for posts in this group (mediaUrls array)
        const posts = await Post.find({ groupId });
        for (const post of posts) {
            if (Array.isArray(post.mediaUrls)) {
                for (const mediaUrl of post.mediaUrls) {
                    if (typeof mediaUrl === 'string' && mediaUrl.includes('cloudinary.com')) {
                        let publicId;
                        const urlParts = mediaUrl.split('/');
                        const uploadIndex = urlParts.findIndex(part => part === 'upload');
                        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                            const startIndex = urlParts[uploadIndex + 1].startsWith('v') ? uploadIndex + 2 : uploadIndex + 1;
                            const pathParts = urlParts.slice(startIndex);
                            const lastPart = pathParts[pathParts.length - 1];
                            pathParts[pathParts.length - 1] = lastPart.split('.')[0];
                            publicId = pathParts.join('/');
                        }
                        if (publicId) {
                            try {
                                await cloudinary.uploader.destroy(publicId);
                            } catch (err) {
                                console.error('Error deleting post media from Cloudinary:', err);
                            }
                        }
                    }
                }
            }
        }

        // 2. Delete all posts belonging to this group
        await Post.deleteMany({ groupId });

        // 3. Delete the group photo (already handled below)
        if (group.image) {
            const imageUrl = group.image;
            let publicId;
            if (imageUrl.includes('cloudinary.com')) {
                const urlParts = imageUrl.split('/');
                const uploadIndex = urlParts.findIndex(part => part === 'upload');
                if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                    const startIndex = urlParts[uploadIndex + 1].startsWith('v') ? uploadIndex + 2 : uploadIndex + 1;
                    const pathParts = urlParts.slice(startIndex);
                    const lastPart = pathParts[pathParts.length - 1];
                    pathParts[pathParts.length - 1] = lastPart.split('.')[0];
                    publicId = pathParts.join('/');
                }
            }
            try {
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
                const expectedPublicId = `group_pictures/group_${groupId}`;
                await cloudinary.uploader.destroy(expectedPublicId);
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion error:', cloudinaryError);
            }
        }

        // 4. Delete the group from database
        await Group.findByIdAndDelete(groupId);

        console.log('=== END DELETE GROUP DEBUG ===');
        res.json({ message: 'Group deleted - check console for debug info' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: error.message });
    }
};

// GET groups by creator
export const getGroupsByCreator = async (req, res) => {// פונק אסינכרונית שמביאה את הקבוצות לםי יוצר ספציפי
    try {
        const userId = req.params.userId; // קבלת מזהה היוזר שרוצים את כל הקבוצות שלו 
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {// וואלידציה שמזהה היוזר הוא לא סתם סטרינג
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const groups = await Group.find({ creator: userId })// מחפש  קבוצות של יוזר זה
            .populate('creator', 'name')// הבא מקולקשנים אחרים גם שם של היוצר ולא רק מזהה
            .sort({ createdAt: -1 });

        res.json(groups);// מחזיר קובץ ג'ייסון של הקבוצות
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET groups where user is a member
export const getGroupsByMember = async (req, res) => { //קבוצות שיוזר זה הוא משתתף בהן אך לא יוצרן 
    try {
        const userId = req.params.userId;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {// וואלידציה שהמזהה תקין
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const groups = await Group.find({ members: userId })//מוצא את כל הקבוצות 
            .populate('creator', 'name')// מביא מקולקשנים אחרים את השם של המשתף
            .sort({ createdAt: -1 });

        res.json(groups);// מחזיר לפרונט קובץ ג'ייסון 
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};