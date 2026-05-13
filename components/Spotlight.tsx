import { DynamicIcon } from "lucide-react/dynamic";
import { motion } from "framer-motion";

interface SpotlightProps {
    onClose: () => void;
}

export function Spotlight({ onClose }: SpotlightProps) {
    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black/70 z-[999999] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl shadow-xl z-50">
                <DynamicIcon name="search" className="size-5 absolute top-4.5 left-4 ml-1 text-muted-foreground" />
                <input 
                autoFocus
                type="text" placeholder="Search users, products, campaigns, etc."
                    className="flex transition-all shadow-xl outline-none bg-card border border-border  w-full  duration-300 ease-in-out cursor-pointer hover:bg-card flex-row items-center p-4 pl-14 border border-border rounded-lg" />


            </motion.div>

            {/**close on click */}
            <div className="size-full absolute top-0 left-0" onClick={onClose} />
        </div>
    );
}