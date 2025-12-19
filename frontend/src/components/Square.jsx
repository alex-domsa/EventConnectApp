import TagPill from './TagPill';
import parseDay from '../utils/dayParser';
import parseTime from '../utils/timeParser';
import '../index.css'; // use project-wide Tailwind/custom styles
import ImageHolder from './imageHolder';

import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import placeholderImage from '../assets/placeholder/placeholder_image.png'; // placeholder provided by you

const Square = ({ obj }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Ensure obj exists and has an ID
    if (!obj) return;
    navigate(`/event/${obj._id || obj.id}`);
  };

  if (!obj) return null; // avoid rendering if no data

  // Determine a valid image URL or fallback to placeholder.
  function resolveImage(srcCandidate) {
    if (!srcCandidate) return placeholderImage;
    // strings: check for common invalid token or non-URL values
    if (typeof srcCandidate === 'string') {
      const s = srcCandidate.trim();
      if (!s || s === 'ADD LATER') return placeholderImage;
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
      // not an absolute URL -> treat as missing (use placeholder)
      return placeholderImage;
    }
    // objects: prefer url/src fields if they look like full URLs
    if (typeof srcCandidate === 'object') {
      const u = srcCandidate.url || srcCandidate.src || srcCandidate.path || srcCandidate.filename;
      if (typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))) return u;
      return placeholderImage;
    }
    return placeholderImage;
  }

  // This is the REAL definition — the one you intended.
  const {
    eventName = 'Untitled Event',
    date = 'TBD',
    startTime = '',
    endTime = '',
    location = 'TBD',
    club = {},
  } = obj;

  const clubName = club?.name || club?.clubName || 'Unknown Club';

  const imageSrc = resolveImage(
    obj.image || obj.imageUrl || obj.img || obj.photo || obj.poster || obj.photo
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick(e);
      }}
      className="cursor-pointer w-full"
    >
      <div className="bg-card card-hover p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30 w-full h-full animate-fade-in flex flex-col items-center gap-4">


        {/* <ImageHolder src={} alt="event" size={150} style={{ objectFit: 'contain' }} /> */}
        {/* When integrating with real data, replace the src prop above with something like: src={obj.imageUrl} */}
        <ImageHolder src={imageSrc} alt="event" size={150} style={{ objectFit: 'cover' }} />

        <div className="square-content text-center">
          <style>{`
            /* enforce uniform card content size; responsive fallback on small screens */
            .square-content { width: 15rem; }
            @media (max-width: 640px) { .square-content { width: 100%; } }
          `}</style>

          <h3 className="text-lg font-semibold">{eventName}</h3>

          {/* people icon - club name */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted mt-1">
            <Users className="w-4 h-4" aria-hidden />
            <span className="truncate font-medium">{clubName}</span>
          </div>

          {/* calendar icon - day + date */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted mt-1">
            <Calendar className="w-4 h-4" aria-hidden />
            <span className="font-medium">{parseDay(date)} {date}</span>
          </div>

          {/* time icon - time */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted mt-1">
            <Clock className="w-4 h-4" aria-hidden />
            <span className="font-medium">
              {parseTime(startTime) || 'TBD'}
              {parseTime(startTime) && parseTime(endTime) ? ` — ${parseTime(endTime)}` : ''}
            </span>
          </div>

          {/* location icon - location value */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted mt-1">
            <MapPin className="w-4 h-4" aria-hidden />
            <span className="font-medium truncate">{location}</span>
          </div>

        </div>

        {Array.isArray(obj.tags) && obj.tags.length > 0 && (
          <div className="tags-container mt-2 flex flex-wrap gap-2">
            {obj.tags.map((tag, i) => (
              <TagPill key={i} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Square;


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
