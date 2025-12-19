import {useState , useEffect} from "react";
import Navbar from "../components/Navbar";
import SquareHolder from "../components/SquareHolder";
import SearchFilter from "../components/SearchFilter";
import ImageDragAndDrop from "../components/ImageDragAndDrop";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

import { BACKEND_URL } from "../config.js";

function Dashboard() {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/add');
    };

    /**
     * Fetch all events (default view)
     */

    const fetchAllData = async () => {

        console.log(`${BACKEND_URL}/api/data`);

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BACKEND_URL}/api/data`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('FETCH ERROR ', error);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle search with filters
     * Builds query string from search parameters
     */
    const handleSearch = async (searchParams) => {
        setLoading(true);
        setError(null);
        try {
            // Build query string from searchParams object
            const queryParams = new URLSearchParams();

            //Only add non-empty parameters
            Object.keys(searchParams).forEach(key => {
                if (searchParams[key]) {
                    queryParams.append(key, searchParams[key]);
                }
            });

            const queryString = queryParams.toString();
            const url = queryString ? `${BACKEND_URL}/api/search?${queryString}` : `${BACKEND_URL}/api/data`;

            const response = await fetch(url);
            const result = await response.json();
            
            //Handle different response formats
            if (result.success) {
                setData(result.data);
            } else {
                setData(result);
            }
        } catch (error) {
            console.error('SEARCH ERROR ', error);
            setError('Failed to search events');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset filters and show all events
     */
    const handleReset = () => {
        fetchAllData();
    };

    

    /**
     * Load all events on component mount
     */
    useEffect(() => {
        fetchAllData();
    }, []);

        // NEW: open details page for the clicked event
  const handleTaskClick = (eventData) => {
    navigate(`/events/${eventData._id}`);
  };


    return (
        <div className="min-h-screen flex flex-col">
            <Navbar/>

            <main className="flex-1">
                {/* keeps page content centered and constrained */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Search and Filter Component */}
                    <SearchFilter onSearch={handleSearch} onReset={handleReset} />

            {/* Loading State */}
            {loading && <p>Loading events...</p>}

                    {/* Error State */}
                    {error && <p style={{color: 'red'}}>Error: {error}</p>}
            
            {/* Event Display */}
            {!loading && !error && data && data.length > 0 ? (
                <div>
                    <SquareHolder tasks={data} onTaskClick={handleTaskClick} />
                </div>
            ) : (
                <p>No events found matching your criteria</p>
            )}  
                </div>
            </main>

            {/* Footer sits at bottom because main uses flex-1 */}
            <Footer />
        </div>

    );
}

export default Dashboard;

// I HAVE PUT THE CURRENT TASK SCHEMA BELOW, IT IS IN JSON FORMAT
// USE THE NAMES ON THE LEFT HAND SIDE TO GRAB THE DATA FROM AN OBJECT

// {
//     "_id":{"$oid":"68e7deb66c1c8cb3254a235c"},
//     "eventName":"DUMMY MEETING",
//     "date":"12/12/2025",
//     "startTime":"14:30:00",
//     "endTime":"16:00:00",
//     "RSVPNeeded":true,
//     "location":"TSI 1",
//     "description":"DUMMY TEXT",
//     "tags":["commuter","stem","sport"],
//     "createdBy":{"$oid":"6712345678901234567890ab"},
//     "muLifeLink":"https://mulife.ie"
//     "clubId": {"$oid":"68e8ee4fcb948e0ad9fd4120"} //THIS LINKS TO SEPERATE MONGODB DATABASE FOR CLUBS
// }

// each lookup will take the clubId from the event and match it to the _id in the clubs collection
// then it will add a "club" field to the event containing the matched club document
// so you can access the club data like event.club.name, event.club.description, etc.