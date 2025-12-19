const Data = require('../models/data');
const Club = require('../models/club');

/**
 * Sarch and Filter Events
 * Supports multiple filter criterias:
 * -----Keyword: seraches in event name, description, and club name
 * -----tags: filters by tags (can be multiple, comma-separated)
 * -----clubName: filters by specific club name
 * -----date: filters by specific date (MM/DD/YYYY format)
 * -----startTime: filters events starting at or after this time
 * -----endTime: filters events ending at or before this time
 * -----location: searches in location field
 * -----RSVPNeeded: filters by RSVP requirment (true/false)
 * 
 * Example: GET /api/search?keyword=meeting&tags=stem,sport&date=12/12/2025
 */
exports.searchEvents = async (req, res) => {
    try {
        const {
            keyword, //General Search Term
            tags, //Comma-separated list of tags
            clubName, //Specific club name
            date, //Event Date filter
            startTime, //Start Time filter
            endTime, //End Time filter
            location, //Location search
            RSVPNeeded, //RSVP filter
        } = req.query;

        //Build the aggregation pipeline
        let pipeline = [];

        //Step 1: Join with clubs collection to get club details
        pipeline.push({
            $lookup: {
                from: "clubs",
                localField: "clubId",
                foreignField: "_id",
                as: "club",
            },
        });

        //Step 2: Unwind the club array (convert array to object)
        pipeline.push({
            $unwind: {
                path: "$club",
                preserveNullAndEmptyArrays: true,
            },
        });

        //Step 3: Build match conditions
        let matchConditions = {};

        //Keyword search - searches across event name, description and club name
        if (keyword) {
            matchConditions.$or = [
                { eventName: { $regex: keyword, $options: "i" } }, //case-insensitive regex
                { description: { $regex: keyword, $options: "i" } },
                { "club.name": { $regex: keyword, $options: "i" } },
            ];
        }

        //Tags filter - matches events that have ANY of the specified tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            matchConditions.tags = { $in: tagArray };
        }

        //Club name filter - exact match (case-insensitive)
        if (clubName) {
            matchConditions["club.name"] = { $regex: clubName, $options: "i" };
        }

        //Date filter - exact date match
        if (date) {
            matchConditions.date = date;
        }

        //Start time filter - events ending at or before specified time
        if (startTime) {
            matchConditions.startTime = { $gte: startTime };
        }

        //End time filter - events ending at or before specified time
        if (endTime) {
            matchConditions.endTime = { $lte: endTime };
        }

        //Location filter - partial match (case-insensitive)
        if (location) {
            matchConditions.location = { $regex: location, $options: "i" };
        }

        //RSVP filter - boolean match
        if (RSVPNeeded !== undefined) {
            matchConditions.RSVPNeeded = RSVPNeeded === 'true';
        }

        //Add match stage if there are any conditions
        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions });
        }

        //Step 4: Sort by date and start time (most recent first)
        pipeline.push({
            $sort: { date: 1, startTime: 1 }
        });

        //Execute the aggregation pipeline
        const events = await Data.aggregate(pipeline);

        res.status(200).json({
            success: true,
            count: events.length,
            data: events,
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching events',
            error: error.message
        });
    }
};

/**
 * Get All Available Tags
 * Returns a list of all unique tags across all events
 * Useful for populating filter dropdowns
 */
exports.getAllTags = async (req, res) => {
    try {
        //Use aggregation to get all unique tags
        const tags = await Data.aggregate([
            { $unwind: "$tags" }, //Separate each tag into its own document
            { $group: { _id: "$tags" } }, //Group by tag to get unique values
            { $project: { _id: 1 } } //Sort alphabetically
        ]);

        //Extract just the tag values
        const tagList = tags.map(tag => tag._id);

        res.status(200).json({
            success: true,
            count: tagList.length,
            data: tagList,
        });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tags',
            error: error.message
        });
    }
};

/**
 * Get All Clubs
 * Returns a list of all clubs
 * Useful for populating club filter dropdowns
 */
exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find({}).select('name description logo').sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: clubs.length,
            data: clubs
        });
    } catch (error) {
        console.error('Get clubs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching clubs',
            error: error.message
        });
    }   
};

exports.getClubById = async (req, res) => {
    try {
        const { id } = req.params;

        // in getClubById:
            const club = await Club.findById(id)
            .select('name description logo gallery admins'); // CHANGED: added admins


        if (!club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found',
            });
        }

        res.status(200).json({
            success: true,
            data: club,
        });
    } catch (error) {
        console.error('Get club by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching club',
            error: error.message,
        });
    }
};



exports.getEventByClubId = async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        // Convert string id to ObjectId
        const mongoose = require('mongoose');
        const clubObjectId = new mongoose.Types.ObjectId(id);
        
        // This finds all events and joins the "clubs" collection for extra info
        const events = await Data.aggregate([
            {
                $match: {
                    clubId: clubObjectId   // match the clubId with the provided id
                }
            },
            {
                $lookup: {
                    from: "clubs",             // collection name in MongoDB
                    localField: "clubId",      // field in Data model
                    foreignField: "_id",       // matching field in Clubs
                    as: "club"                 // new field to store matched club
                }
            },
            {
                $unwind: {
                    path: "$club",             // deconstructs the club array
                    preserveNullAndEmptyArrays: true // allows events with no club
                }
            },
        ]);
        
        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Get events by club ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching events',
            error: error.message 
        });
    }
};

/**
 * Advanced Filter with Multiple Criteria
 * More structured approach to filtering 
 * Accepts a JSON body with filter criteria
 */
exports.advancedFilter = async (req, res) => {
    try {
        const filters = req.body;

        let pipeline = [];

        //Join with clubs
        pipeline.push({
            $lookup: {
                from: "clubs",
                localField: "clubId",
                foreignField: "_id",
                as: "club"
            }
        });

        //Unwind the club array
        pipeline.push({
            $unwind: {
                path: "$club",
                preserveNullAndEmptyArrays: true,
            }
        });
        //Build match conditions from request body
        let matchConditions = {};

        //Handle multiple tags (must match ALL tags)
        if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
            matchConditions.tags = { $all: filters.tags };
        }

        //Handle club IDs
        if (filters.clubIds && Array.isArray(filters.clubIds) && filters.clubIds.length > 0) {
            matchConditions.clubId = { $in: filters.clubIds };
        }

        //Date range filter
        if (filters.dateFrom || filters.dateTo) {
            matchConditions.date = {};
            if (filters.dateFrom) {
                matchConditions.date.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchConditions.date.$lte = filters.dateTo;
            }
        }

        //RSVP filter
        if (filters.RSVPNeeded !== undefined) {
            matchConditions.RSVPNeeded = filters.RSVPNeeded;
        }

        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions });
        }

        //Sort by date and start time (most recent first)
        pipeline.push({
            $sort: { date: 1, startTime: 1 }
        });

        const events = await Data.aggregate(pipeline);

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('Advanced filter error:', error);
        res.status(500).json({
            success: false,
            message: 'Error applying events',
            error: error.message
        });
    }
};