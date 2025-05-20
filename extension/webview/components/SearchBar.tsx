import { useState } from "react";

const SearchBar: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("")
    return (
        <div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a user..."
                className="p-2 border border-[color:var(--vscode-input-border)] bg-[color:var(--vscode-input-background)] text-[color:var(--vscode-input-foreground)] rounded-md focus:outline-none"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();

                    }
                }}
            />
        </div>
    )
}

export default SearchBar