import { useState, useEffect, useRef } from 'react';
import './SearchFilter.css';
import { BACKEND_URL } from '../config.js';
/**
 * SearchFilter Component
 * Provides search bar and filter options for events
 *
 * Properties:
 * ---onSearch: callback function that receives search/filter parameters
 * ---onReset: callback function to reset filters
 */



const SearchFilter = ({ onSearch, onReset }) => {
    //Search state
    const [keyword, setKeyword] = useState('');

    //Filter states
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedClub, setSelectedClub] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [rsvpFilter, setRsvpFilter] = useState('');

    //Available options fetched from backend API
    const [availableTags, setAvailableTags] = useState([]);
    const [availableClubs, setAvailableClubs] = useState([]);

    //UI state
    const [showFilters, setShowFilters] = useState(false);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [tagQuery, setTagQuery] = useState('');
    const [showClubMenu, setShowClubMenu] = useState(false);
    const [clubQuery, setClubQuery] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const tagMenuRef = useRef(null);
    const clubMenuRef = useRef(null);
    const datePickerRef = useRef(null);

    /**
     * Fetch available tags and clubs on component mount
     * These are used to populate filter dropdowns
     */
    useEffect(() => {
        fetchTags();
        fetchClubs();
    }, []);

    /**
     * Close dropdowns when clicking outside
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showTagMenu && tagMenuRef.current && !tagMenuRef.current.contains(event.target)) {
                setShowTagMenu(false);
            }
            if (showClubMenu && clubMenuRef.current && !clubMenuRef.current.contains(event.target)) {
                setShowClubMenu(false);
            }
            if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTagMenu, showClubMenu, showDatePicker]);

    /**
     * Fetch all uniqure tags from API
     */
    const fetchTags = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/search/tags`);
            const result = await response.json();
            if (result.success) {
                setAvailableTags(result.data);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    /**
     * Fetch all clubs from API
     */
    const fetchClubs = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/search/clubs`);
            const result = await response.json();
            if (result.success) {
                setAvailableClubs(result.data);
            }
        } catch (error) {
            console.error('Error fetching clubs:', error);
        }
    };

    /**
     * Filter tags and clubs according to search query
     */
    const filteredTags = availableTags.filter(tag =>
        tag.toLowerCase().includes(tagQuery.toLowerCase())
    );

    const filteredClubs = availableClubs.filter(club =>
        club.name.toLowerCase().includes(clubQuery.toLowerCase())
    );

    /**
     * Handle tag selection/deselection
     */
    const handleTagToggle = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag) //Remove if already selected
                : [...prev, tag] //Add if not selected
        );
    };

    /**
     * Handle search button click
     * Builds search parameters and calls parent callback
     */
    const handleSearch = () => {
        const searchParams = {
            keyword: keyword.trim(),
            tags: selectedTags.join(','),
            clubName: selectedClub,
            date: selectedDate,
            location: selectedLocation,
            RSVPNeeded: rsvpFilter
        };

        //Call parent callback with search parameters
        onSearch(searchParams);
        setShowTagMenu(false);
    };

    /**
     * Apply filters and hide advanced panel
     */
    const handleApplyFilters = () => {
        handleSearch();
        setShowFilters(false);
    };

    /**
     * Reset all filters to default state
     */
    const handleReset = () => {
        setKeyword('');
        setSelectedTags([]);
        setSelectedClub('');
        setSelectedDate('');
        setSelectedLocation('');
        setRsvpFilter('');
        setTagQuery('');
        setClubQuery('');
        setShowTagMenu(false);
        setShowClubMenu(false);
        setShowDatePicker(false);
        onReset(); //Call parent reset callback
    };

    /**
     * Hnadle Enter key press in search input
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="search-filter-container" >
            {/* Search Bar Section */}
            <div className="search-bar-section  ">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by event name, description or club..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="search-button" onClick={handleSearch}>Search</button>
                <button
                    className="filter-toggle-button"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>

            <div className="tag-quick-filter" ref={tagMenuRef}>
                <button
                    type="button"
                    className="tag-menu-toggle"
                    onClick={() => setShowTagMenu(prev => !prev)}
                >
                    <span>
                        {selectedTags.length > 0
                            ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                            : 'Filter by tags'}
                    </span>
                    <span className="chevron">{showTagMenu ? '▲' : '▼'}</span>
                </button>

                {showTagMenu && (
                    <div className="tag-menu">
                        <input
                            type="text"
                            className="tag-search-input"
                            placeholder="Search tags..."
                            value={tagQuery}
                            onChange={(e) => setTagQuery(e.target.value)}
                        />

                        <div className="tag-list">
                            {filteredTags.length === 0 ? (
                                <p className="tag-empty-state">No tags match "{tagQuery}"</p>
                            ) : (
                                filteredTags.map(tag => (
                                    <label key={tag} className="tag-option">
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.includes(tag)}
                                            onChange={() => handleTagToggle(tag)}
                                        />
                                        <span>{tag}</span>
                                    </label>
                                ))
                            )}
                        </div>

                        

                        <div className="tag-menu-actions">
                            <button
                                type="button"
                                className="tag-clear-button"
                                onClick={() => setSelectedTags([])}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="tag-apply-button"
                                onClick={handleSearch}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Advanced Filters Section */}
            {showFilters && (
                <div className="filters-section">
                    <h3>Advanced Filters</h3>

                    {/* Club Filter */}
                    <div className="filter-group">
                        <label>Club</label>
                        <div className="selector-popover" ref={clubMenuRef}>
                            <button
                                type="button"
                                className="selector-trigger"
                                onClick={() => setShowClubMenu(prev => !prev)}
                            >
                                <span>{selectedClub || 'All Clubs'}</span>
                                <span className="chevron">{showClubMenu ? '▲' : '▼'}</span>
                            </button>

                            {showClubMenu && (
                                <div className="selector-menu">
                                    <input
                                        type="text"
                                        className="selector-search"
                                        placeholder="Search clubs..."
                                        value={clubQuery}
                                        onChange={(e) => setClubQuery(e.target.value)}
                                    />
                                    <ul className="selector-list">
                                        <li>
                                            <button
                                                type="button"
                                                className={`selector-option ${selectedClub === '' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedClub('');
                                                    setShowClubMenu(false);
                                                }}
                                            >
                                                All Clubs
                                            </button>
                                        </li>
                                        {filteredClubs.length === 0 && (
                                            <li className="selector-empty">No clubs found.</li>
                                        )}
                                        {filteredClubs.map(club => (
                                            <li key={club._id}>
                                                <button
                                                    type="button"
                                                    className={`selector-option ${selectedClub === club.name ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setSelectedClub(club.name);
                                                        setShowClubMenu(false);
                                                    }}
                                                >
                                                    {club.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="filter-group">
                        <label>Date</label>
                        <div className="selector-popover" ref={datePickerRef}>
                            <button
                                type="button"
                                className="selector-trigger"
                                onClick={() => setShowDatePicker(prev => !prev)}
                            >
                                <span>{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select date'}</span>
                                <span className="chevron">{showDatePicker ? '▲' : '▼'}</span>
                            </button>
                            {showDatePicker && (
                                <div className="selector-menu date-menu">
                                    <input
                                        type="date"
                                        className="selector-date-input"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                    <div className="selector-actions">
                                        <button
                                            type="button"
                                            className="tag-clear-button"
                                            onClick={() => setSelectedDate('')}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            className="tag-apply-button"
                                            onClick={() => setShowDatePicker(false)}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location Filter */}
                    <div className="filter-group">
                        <label htmlFor="location-input">Location:</label>
                        <input
                            id="location-input"
                            type="text"
                            className="filter-input"
                            placeholder="Enter location..."
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        />
                    </div>

                    {/* RSVP Filter */}
                    <div className="filter-group">
                        <label htmlFor="rsvp-select">RSVP Required:</label>
                        <div className="rsvp-toggle">
                            {[
                                { label: 'All', value: '' },
                                { label: 'Yes', value: 'true' },
                                { label: 'No', value: 'false' }
                            ].map(option => (
                                <button
                                    key={option.label}
                                    type="button"
                                    className={`rsvp-chip ${rsvpFilter === option.value ? 'active' : ''}`}
                                    onClick={() => setRsvpFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="filter-actions">
                        <button className="apply-button" onClick={handleApplyFilters}>Apply Filters</button>
                        <button className="reset-button" onClick={handleReset}>Reset All</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilter;
