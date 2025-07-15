import Group from '../models/Group.js';
import Post from '../models/PostModel.js';
import mongoose from 'mongoose';

// Get group analytics data
export const getGroupAnalytics = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { timeRange = '7' } = req.query;
        
        console.log(`📊 Analytics requested for group: ${groupId}, timeRange: ${timeRange} days`);
        
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            console.log('❌ Invalid group ID format');
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        const group = await Group.findById(groupId).populate('creator members');
        if (!group) {
            console.log('❌ Group not found');
            return res.status(404).json({ message: 'Group not found' });
        }

        console.log(`✅ Group found: ${group.name}`);

        // Calculate date range
        let startDate = new Date();
        let endDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        console.log(`📅 Date range: ${startDate} to ${endDate}`);

        // Parse month range from query
        let { startMonth, endMonth } = req.query;
        let customMonthRange = false;
        if (startMonth && endMonth) {
            customMonthRange = true;
            // Set startDate and endDate to cover the full months
            startDate = new Date(startMonth + '-01T00:00:00Z');
            // End date: last day of endMonth
            const [endY, endM] = endMonth.split('-').map(Number);
            endDate = new Date(endY, endM, 0, 23, 59, 59, 999); // last ms of month
        }

        // 1. Posts Analytics - Using your exact schema
        const posts = await Post.find({
            groupId: new mongoose.Types.ObjectId(groupId),
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: 1 });

        console.log(`📈 Found ${posts.length} posts in time range`);

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

        // Only include months with posts for the group
        // Group posts by month and aggregate likes
        const postsByMonth = {};
        const likesByMonth = {};
        posts.forEach(post => {
            const month = new Date(post.createdAt).toISOString().slice(0, 7); // YYYY-MM
            postsByMonth[month] = (postsByMonth[month] || 0) + 1;
            likesByMonth[month] = (likesByMonth[month] || 0) + (post.likedBy?.length || 0);
        });
        // Only months with posts
        const monthsWithPosts = Object.keys(postsByMonth).sort();
        const postsTimelineMonthly = monthsWithPosts.map(monthStr => ({
            month: monthStr,
            count: postsByMonth[monthStr] || 0,
            likes: likesByMonth[monthStr] || 0,
            formattedMonth: new Date(monthStr + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' })
        }));

        // Simulate new members per month (since join dates are not tracked)
        const memberGrowthByMonth = [];
        let prevMembers = null;
        monthsWithPosts.forEach(monthStr => {
            // Find the last day in memberGrowth for this month
            const lastDay = memberGrowth.filter(mg => mg.date.startsWith(monthStr)).slice(-1)[0];
            if (lastDay) {
                const newMembers = prevMembers === null ? lastDay.members : lastDay.members - prevMembers;
                memberGrowthByMonth.push({
                    month: monthStr,
                    newMembers: newMembers < 0 ? 0 : newMembers,
                    formattedMonth: new Date(monthStr + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' })
                });
                prevMembers = lastDay.members;
            } else {
                memberGrowthByMonth.push({
                    month: monthStr,
                    newMembers: 0,
                    formattedMonth: new Date(monthStr + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' })
                });
            }
        });

        // Top 5 contributors (by post count) in selected range
        const userPostCounts = {};
        const userIdToName = {};
        for (const post of posts) {
            const uid = post.userId?.toString?.() || post.userId;
            userPostCounts[uid] = (userPostCounts[uid] || 0) + 1;
            if (post.userId && typeof post.userId === 'object') {
                userIdToName[uid] = post.userId.displayName || post.userId.name || post.userId.email || 'Unknown';
            }
        }
        const sortedContrib = Object.entries(userPostCounts).sort((a, b) => b[1] - a[1]);
        const topContrib = sortedContrib.slice(0, 5).map(([userId, count]) => ({
            userId,
            displayName: userIdToName[userId] || 'Unknown',
            postCount: count
        }));
        const otherContribCount = sortedContrib.slice(5).reduce((sum, [, count]) => sum + count, 0);
        if (otherContribCount > 0) {
            topContrib.push({ userId: 'other', displayName: 'Other', postCount: otherContribCount });
        }

        // Top 5 most liked users (by total likes received on their posts)
        const userLikeCounts = {};
        for (const post of posts) {
            const uid = post.userId?.toString?.() || post.userId;
            userLikeCounts[uid] = (userLikeCounts[uid] || 0) + (post.likedBy?.length || 0);
        }
        const sortedLiked = Object.entries(userLikeCounts).sort((a, b) => b[1] - a[1]);
        const topLiked = sortedLiked.slice(0, 5).map(([userId, count]) => ({
            userId,
            displayName: userIdToName[userId] || 'Unknown',
            likeCount: count
        }));
        const otherLikedCount = sortedLiked.slice(5).reduce((sum, [, count]) => sum + count, 0);
        if (otherLikedCount > 0) {
            topLiked.push({ userId: 'other', displayName: 'Other', likeCount: otherLikedCount });
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
                postsTimelineMonthly, // legacy, not used
                postsTimelineMonthlyFiltered: postsTimelineMonthly, // only months with posts
                hourlyActivity,
                weeklyActivity,
                topContributors: topContrib,
                topLikedUsers: topLiked
            },
            memberAnalytics: {
                totalMembers,
                memberGrowth,
                memberGrowthByMonth, // only months with posts
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

        console.log(`✅ Analytics calculated successfully for group ${group.name}`);
        console.log(`📊 Returning data:`, {
            totalPosts: analytics.postsAnalytics.totalPosts,
            totalLikes: analytics.postsAnalytics.totalLikes,
            totalMembers: analytics.memberAnalytics.totalMembers
        });
        
        res.json(analytics);
    } catch (error) {
        console.error('❌ Error fetching group analytics:', error);
        res.status(500).json({ message: error.message });
    }
};