import React from "react";
import Square from "./Square";
import './SquareHolder.css';
/**
 * Tailwind classes for SquareHolder layout
 *
 * Use `containerClass` on the outer wrapper and `itemClass` on each item.
 * - container: full width, flexbox wrap, centers items in each row (justify-center),
 *   aligns items to the top of the row (items-start).
 * - item: box sizing and horizontal padding so items space nicely; keep
 *   min width handled by the component's inline `minItemWidth` prop (or by
 *   a width class you add to the Square later).
 *
 * Example usage (inside the component below you can swap style prop for className):
 * <div className={containerClass} style={{ gap: `${gap}px` }}>
 *   <div key={key} className={itemClass} style={{ flex: `0 1 ${minItemWidth}px` }}>
 *     ...
 *   </div>
 * </div>
 */
export const containerClass = "w-full flex flex-wrap justify-center items-start";
export const itemClass = "box-border px-2 mb-3";

const SquareHolder = ({ tasks = [], minItemWidth = 220, gap = 12, onTaskClick = () => { } }) => {
    const containerStyle = {
        display: "flex",
        flexWrap: "wrap",
        gap: `${gap}px`,
        alignItems: "flex-start",
    };

    // Each item will try to be at least minItemWidth, but will shrink if needed.
    // Using 0 1 minWidth so items wrap to the next line when they cannot fit.
    const itemStyle = {
        flex: `0 1 ${minItemWidth}px`,
        boxSizing: "border-box",
    };

    // extraOffset (px) — increase this to push the holder further down if needed
    const extraOffset = 8;

    // Prefer a CSS variable set by your Navbar component: --navbar-height (e.g. "64px").
    // Fallback is 64px if the variable is not present.
    const paddingTop = `calc(var(--navbar-height, 64px) + ${extraOffset}px)`;

    return (
        <div className={containerClass} style={{ ...containerStyle, paddingTop }}>
            {tasks.map((task, idx) => {
                const key = task._id || task.id || idx;
                return (
                    <div
                        key={key}
                        className="box-border flexbox px-2 mb-3"
                    >
                        <Square obj={task} onClick={() => onTaskClick(task)} />
                    </div>
                );
            })}
        </div>
    );
};


export default SquareHolder;