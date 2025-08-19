// MenuBar.jsx
import { Link } from "react-router-dom";
import TbcLogoDark from "../../assets/pl_logo_db.svg";
import TbcLogoLight from "../../assets/pl_logo_w.svg";
import { useTheme } from "../../context/theme-provider";
import { ModeToggle } from "./mode-toggle";
import { cn } from "../shadcn-components/lib/utils";

export function MenuBar() {
  const theme = useTheme();
  const logo = theme.isDarkMode ? TbcLogoLight : TbcLogoDark;
  const triggerClass = "px-3 py-2 rounded transition-colors";

  const menuItems = [
    { label: "ETL-Automate", path: "/" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50"
      style={{
        borderBottom: `1px solid ${theme.borderArea}`,
        backgroundColor: theme.background,
      }}
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center" style={{ color: theme.primaryText }}>
          <img src={logo} alt="Logo" className="h-6 w-auto mr-2" />
          <span className="text-xl font-bold">Prosim Laboratories LLC</span>
        </Link>

        {/* Menu Items */}
        <div className="hidden md:flex space-x-4">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={cn(triggerClass)}
              style={{ color: theme.primaryText }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
