import { Search } from 'lucide-react'
import React from 'react'

type SearchProps = {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  filterBy: string;
  setFilterBy: (filterBy: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

const SearchNavbar = ({ searchTerm, setSearchTerm, filterBy, setFilterBy, sortBy, setSortBy }: SearchProps) => {
  return (
            <div className="hell-card p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 hell-glass border border-red-500/30 rounded-lg text-white placeholder-orange-400 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="hell-glass border border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="all">All Tokens</option>
                  <option value="trending">Trending</option>
                  <option value="verified">Verified</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="hell-glass border border-red-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="marketCap">Market Cap</option>
                  <option value="volume">Volume</option>
                  <option value="price">Price</option>
                  <option value="holders">Holders</option>
                </select>
              </div>
            </div>
          </div>
  )
}

export default SearchNavbar