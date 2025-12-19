import React from "react";

function Footer() {
    return (
        <footer className="mt-auto border-t border-border bg-background/90 text-foreground bg-primary/25">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold">
                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Event Connect
                        </span>
                    </div>
                    <p className="text-sm opacity-80">Be there or be square!</p>
                </div>

                <div className="text-sm text-center">
                    <p>
                        © {new Date().getFullYear()} Event Connect — Team: Ferdia, Jamie, Alex, Mia,
                        Sean, Obinna, Serin
                    </p>
                    <p className="mt-2 text-xs opacity-70">National University of Ireland Maynooth</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;