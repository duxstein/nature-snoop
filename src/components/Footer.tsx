const Footer = () => {
  return (
    <footer className="mt-20 py-8 bg-gradient-to-r from-natural-50 to-natural-100 border-t border-natural-200">
      <div className="container mx-auto px-4 text-center">
        <p className="text-natural-600">
          Powered by AI • Made with 🌿 by PlantAI
        </p>
        <p className="text-natural-400 text-sm mt-2">
          © {new Date().getFullYear()} PlantAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;