import { Search, Settings, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-logo">
                    <div className="navbar-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                    </div>
                    <span>Glassbox</span>
                </Link>

                <div className="navbar-search">
                    <input
                        type="text"
                        className="input input-search"
                        placeholder="Search cases, evidence..."
                    />
                </div>

                <div className="navbar-actions">
                    <button className="btn btn-ghost btn-icon">
                        <Bell size={20} />
                    </button>
                    <button className="btn btn-ghost btn-icon">
                        <Settings size={20} />
                    </button>
                    <div className="user-avatar">JS</div>
                </div>
            </div>
        </nav>
    );
}
