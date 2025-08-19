// Footer.tsx
import React from "react";
import { Link } from 'react-router-dom';
// Import icons from react-icons
import { FaTwitter, FaLinkedin, FaYoutube, FaGithub } from 'react-icons/fa';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="pt-4 border-t border-gray-200 text-sm text-center">
      <div className="flex items-center justify-center space-x-4">

        <span>Founded in 2024, Prosim Laboratories LLC</span>

        <span className="inline-block align-middle">|</span>

        <Link
          to="/contact-us"
          onClick={scrollToTop}
          className="underline hover:text-primary"
        >
          Contact Us
        </Link>

        <span className="inline-block align-middle">|</span>

        <a
          href="https://twitter.com/labsProsim"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-primary"
        >
          <FaTwitter className="h-5 w-5" />
        </a>

        <a
          href="https://www.linkedin.com/company/prosim-laboratories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-primary"
        >
          <FaLinkedin className="h-5 w-5" />
        </a>

        {/* <a
          href="https://www.youtube.com/ProsimLabs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-primary"
        >
          <FaYoutube className="h-5 w-5" />
        </a> */}

        <a
          href="https://github.com/Prosim-Laboratories"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-primary"
        >
          <FaGithub className="h-5 w-5" />
        </a>
      </div>
    </footer>
  );
}
