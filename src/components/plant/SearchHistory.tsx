import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface SearchHistoryProps {
  searchHistory: any[];
  onDelete: (id: string) => void;
}

const SearchHistory = ({ searchHistory, onDelete }: SearchHistoryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="mt-16"
    >
      <h2 className="text-2xl font-semibold text-natural-800 mb-6">Your Search History</h2>
      <ScrollArea className="h-[400px] rounded-lg border border-natural-200 bg-white/50 backdrop-blur-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchHistory.map((item) => (
            <Card key={item.id} className="p-4 relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-natural-600" />
              </Button>
              <div className="aspect-square rounded-lg overflow-hidden mb-3">
                <img
                  src={item.image_url}
                  alt={item.search_term}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium text-natural-800">{item.search_term}</h3>
              <p className="text-sm text-natural-600">
                {format(new Date(item.created_at), 'MMM d, yyyy')}
              </p>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default SearchHistory;