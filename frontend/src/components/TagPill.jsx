import React from "react";


    const TagPill = ({ tag }) => {

        return (
           <span className="inline-flex items-center bg-primary text-primary-foreground rounded-full px-3 py-2 text-sm font-medium ">
                {tag}
            </span>
        );
    };

export default TagPill;