"use client";

import { DynamicIcon } from "lucide-react/dynamic";

interface SidebarToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

export function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
    return (
        <div
            onClick={onToggle}
            className={`fixed z-50 flex items-center hover:rotate-180 justify-center cursor-pointer hover:opacity-100 outline outline-4 outline-offset-2 bg-black dark:bg-white rounded-full transition-all duration-300 ease-in-out ${isOpen ? '-right-[420px] bottom-8 size-14' : 'right-8 bottom-8 size-14'}`}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
            {isOpen ? (
                <DynamicIcon name="sparkles" strokeWidth={0.5} className="size-6 text-white dark:text-black fill-white dark:fill-black" />
            ) : (
                <DynamicIcon name="sparkles" strokeWidth={0.5} className="size-6 text-white dark:text-black fill-white dark:fill-black" />
            )}
        </div>
    );
}

