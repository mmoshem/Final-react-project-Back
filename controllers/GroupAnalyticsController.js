import Group from '../models/Group.js';
import Post from '../models/PostModel.js';
import mongoose from 'mongoose';

// Get group analytics data
export const getGroupAnalytics = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { timeRange = '7' } = req.query;
        
        
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        const group = await Group.findById(groupId).populate('creator members');
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }


        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));


        // 1. Posts Analytics - Using your exact schema
        const posts = await Post.find({
            groupId: new mongoose.Types.ObjectId(groupId),
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: 1 });


        // Calculate engagement metrics
        const totalLikes = posts.reduce((sum, post) => sum + (post.likedBy?.length || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
        const postsWithMedia = posts.filter(post => post.mediaUrls?.length > 0).length;
        const editedPosts = posts.filter(post => post.editedAt).length;

        // Group posts by day
        const postsByDay = {};
        posts.forEach(post => {
            const day = new Date(post.createdAt).toISOString().split('T')[0];
            postsByDay[day] = (postsByDay[day] || 0) + 1;
        });

        // Fill missing days with 0 for complete timeline
        const postsTimeline = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayStr = d.toISOString().split('T')[0];
            postsTimeline.push({
                date: dayStr,
                count: postsByDay[dayStr] || 0,
                formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }

        // 2. Member Growth Simulation (since you don't track join dates)
        const memberGrowth = [];
        const totalMembers = group.memberCount || 0;
        const daysInRange = parseInt(timeRange);
        
        // Simulate gradual member growth
        for (let i = 0; i <= daysInRange; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dayStr = date.toISOString().split('T')[0];
            
            // Simulate realistic growth curve
            const growthProgress = i / daysInRange;
            const memberCount = Math.floor(totalMembers * (0.3 + 0.7 * growthProgress));
            memberGrowth.push({
                date: dayStr,
                members: memberCount,
                formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }

        // 3. Activity distribution by hour (0-23)
        const activityByHour = Array(24).fill(0);
        posts.forEach(post => {
            const hour = new Date(post.createdAt).getHours();
            activityByHour[hour]++;
        });

        const hourlyActivity = activityByHour.map((count, hour) => ({
            hour,
            count,
            label: `${hour.toString().padStart(2, '0')}:00`
        }));

        // 4. Activity by day of week
        const dayOfWeekActivity = Array(7).fill(0);
        posts.forEach(post => {
            const dayOfWeek = new Date(post.createdAt).getDay();
            dayOfWeekActivity[dayOfWeek]++;
        });

        const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyActivity = dayOfWeekActivity.map((count, day) => ({
            day: weekDayLabels[day],
            fullDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
            count
        }));

        // 5. Calculate averages
        const totalPosts = posts.length;
        const avgPostsPerDay = (totalPosts / parseInt(timeRange)).toFixed(1);
        const avgPostsPerWeek = (avgPostsPerDay * 7).toFixed(1);
        const avgLikesPerPost = totalPosts > 0 ? (totalLikes / totalPosts).toFixed(1) : 0;
        const avgCommentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : 0;
        const mediaUsageRate = totalPosts > 0 ? ((postsWithMedia / totalPosts) * 100).toFixed(1) : 0;

        // 6. Find peak activity times
        const mostActiveHour = hourlyActivity.reduce((max, curr) => 
            curr.count > max.count ? curr : max, { hour: 0, count: 0, label: '00:00' }
        );
        
        const mostActiveDay = weeklyActivity.reduce((max, curr) => 
            curr.count > max.count ? curr : max, { day: 'N/A', count: 0 }
        );

        const analytics = {
            groupInfo: {
                id: group._id,
                name: group.name,
                memberCount: totalMembers,
                isPrivate: group.isPrivate,
                createdAt: group.createdAt
            },
            timeRange: {
                days: parseInt(timeRange),
                startDate,
                endDate,
                label: `Last ${timeRange} days`
            },
            postsAnalytics: {
                totalPosts,
                avgPostsPerDay: parseFloat(avgPostsPerDay),
                avgPostsPerWeek: parseFloat(avgPostsPerWeek),
                totalLikes,
                totalComments,
                avgLikesPerPost: parseFloat(avgLikesPerPost),
                avgCommentsPerPost: parseFloat(avgCommentsPerPost),
                postsWithMedia,
                mediaUsageRate: parseFloat(mediaUsageRate),
                editedPosts,
                postsTimeline,
                hourlyActivity,
                weeklyActivity
            },
            memberAnalytics: {
                totalMembers,
                memberGrowth,
                currentPendingRequests: group.pendingRequests?.length || 0
            },
            summary: {
                mostActiveHour,
                mostActiveDay,
                engagementRate: totalPosts > 0 ? ((totalLikes + totalComments) / totalPosts).toFixed(1) : 0,
                avgEngagementPerMember: totalMembers > 0 ? ((totalLikes + totalComments) / totalMembers).toFixed(1) : 0,
                activityLevel: totalPosts > 0 ? 'Active' : 'Low Activity'
            }
        };

       
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};