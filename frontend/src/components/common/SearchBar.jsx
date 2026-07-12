import { FiSearch } from 'react-icons/fi';
import './common.css';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className="dqp-search">
      <FiSearch />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
