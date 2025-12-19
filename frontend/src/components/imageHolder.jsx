import React from "react";
import placeholder_image from '../assets/placeholder/placeholder_image.png';

class ImageHolder extends React.Component {
    render() {
        const { src = "", alt = "", size = 200, style = {}, className = "" } = this.props;

        const dimension = typeof size === "number" ? `${size}px` : (size || "200px");

        const containerStyleFallback = {
            width: dimension,
            height: dimension,
            overflow: "hidden",
            display: "inline-block",
            backgroundColor: "#f0f0f0",
            textAlign: "center",
            ...style,
        };

        const imgStyleFallback = {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
        };

        // Render image; if src falsy use placeholder.
        // onError handler ensures broken URLs fall back to the placeholder (only swap once).
        const effectiveSrc = src && String(src).trim() ? src : placeholder_image;

        return (
            <div className={className ? `image-holder ${className}` : "image-holder"} style={containerStyleFallback}>
                <img
                    src={effectiveSrc}
                    alt={alt}
                    style={imgStyleFallback}
                    onError={(e) => {
                        try {
                            if (e && e.target && e.target.src !== placeholder_image) {
                                e.target.src = placeholder_image;
                            }
                        } catch (err) {
                            // ignore
                        }
                    }}
                />
            </div>
        );
    }
}

export default ImageHolder;