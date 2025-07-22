import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FiHeart, 
  FiUsers, 
  FiTrendingUp, 
  FiAward, 
  FiGlobe,
  FiArrowRight,
  FiPlay,
  FiCheckCircle,
  FiStar,
  FiGift,
  FiShield,
  FiZap,
  FiHome,
  FiMail,
  FiLinkedin,
  FiUser,
  FiSun,
  FiMoon
} from "react-icons/fi";
import donateFood from '../assets/carousel/donateFood.jpg';
import saveFoodImage from '../assets/carousel/saveFoodImage.jpg';
import saveFoodImage3 from '../assets/carousel/saveFoodImage3.jpg';
import farmer from '../assets/carousel/farmer.jpg';
import farmer2 from '../assets/carousel/farmer2.jpg';
import images from '../assets/carousel/images.jpg';
import nature from '../assets/carousel/nature.jpg';

// ImageCarousel component for food donation/saving theme
function ImageCarousel() {
  const imagesArr = [
    {
      url: donateFood,
      alt: 'People donating food',
      caption: 'People donating food to those in need',
    },
    {
      url: saveFoodImage,
      alt: 'Saving food for donation',
      caption: 'Saving food for donation',
    },
    {
      url: saveFoodImage3,
      alt: 'Sustainable food practices',
      caption: 'Sustainable food practices: saving and sharing food',
    },
    {
      url: farmer,
      alt: 'Farmer with fresh produce',
      caption: 'Supporting local farmers and reducing waste',
    },
    {
      url: farmer2,
      alt: 'Community food bank',
      caption: 'Community food banks and volunteers',
    },
    {
      url: images,
      alt: 'Happy recipients',
      caption: 'Happy families receiving donated food',
    },
    {
      url: nature,
      alt: 'Nature and sustainability',
      caption: 'Protecting nature through food sustainability',
    },
  ];
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % imagesArr.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hovered, imagesArr.length]);

  return (
    <div className="w-full flex justify-center my-6">
      <div
        className="relative w-full max-w-3xl h-64 rounded-2xl overflow-hidden shadow-lg group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {imagesArr.map((img, idx) => (
          <img
            key={img.url}
            src={img.url}
            alt={img.alt}
            className={`absolute top-0 left-0 w-full h-64 object-cover rounded-2xl transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            draggable={false}
          />
        ))}
        {/* Caption overlay */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-base font-medium shadow-lg z-20 min-w-[60%] text-center">
          {imagesArr[current].caption}
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {imagesArr.map((_, idx) => (
            <button
              key={idx}
              className={`w-3 h-3 rounded-full border-2 border-white bg-white transition-all duration-300 ${idx === current ? 'bg-emerald-500 border-emerald-500 scale-125' : 'bg-white/70'}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Prominent dark/light mode toggle
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const features = [
    {
      icon: FiHome,
      title: "Smart Food Tracking",
      description: "Track your food inventory with AI-powered expiry predictions and waste reduction insights.",
      color: "text-green-500"
    },
    {
      icon: FiHeart,
      title: "Food Donation Network",
      description: "Connect with local communities to donate surplus food and reduce waste while helping others.",
      color: "text-red-500"
    },
    {
      icon: FiTrendingUp,
      title: "Analytics & Insights",
      description: "Get detailed analytics on your consumption patterns and waste reduction progress.",
      color: "text-blue-500"
    },
    {
      icon: FiAward,
      title: "Gamification",
      description: "Earn achievements and rewards as you reduce food waste and help the environment.",
      color: "text-purple-500"
    }
  ];

  const stats = [
    { number: "30%", label: "Average Waste Reduction", icon: FiTrendingUp },
    { number: "500+", label: "Food Items Saved", icon: FiHeart },
    { number: "50+", label: "Communities Helped", icon: FiUsers },
    { number: "1000+", label: "Lives Impacted", icon: FiGlobe }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Chef",
      content: "This app helped me reduce my food waste by 40% and I love being able to donate surplus food to my community!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Restaurant Owner",
      content: "The AI predictions are incredibly accurate. We've saved thousands of dollars and reduced our environmental impact.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Environmental Activist",
      content: "Finally, a solution that makes food waste reduction fun and rewarding. The donation feature is brilliant!",
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // setCurrentFeature((prev) => (prev + 1) % features.length); // This line was removed
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-white dark:from-green-950 dark:via-gray-900 dark:to-blue-950 transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FiHome className="h-8 w-8 text-green-500" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FoodGuard
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">
                Features
              </a>
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">
                Contact
              </a>
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 border-2 border-green-500 text-green-500 rounded-lg font-semibold hover:bg-green-500 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="text-green-500">Save Food,</span>
              <br />
              Save the Planet
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of people reducing food waste with AI-powered tracking, 
              smart analytics, and a community-driven donation network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-green-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start Your Journey</span>
                <FiArrowRight className="h-5 w-5" />
              </button>
              <button
                className="border-2 border-green-500 text-green-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2"
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <FiPlay className="h-5 w-5" />
                <span>Learn More</span>
              </button>
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        <ImageCarousel />

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <FiHome className="h-8 w-8 text-green-400 opacity-60" />
        </div>
        <div className="absolute top-40 right-20 animate-pulse">
          <FiHeart className="h-6 w-6 text-red-400 opacity-60" />
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce">
          <FiGlobe className="h-6 w-6 text-blue-400 opacity-60" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to reduce food waste and make a difference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
                >
                  <div className={`${feature.color} mb-4`}>
                    <Icon className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Making Real Impact
            </h2>
            <p className="text-xl text-green-100">
              Join our growing community of food waste warriors
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-green-100 text-sm">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Donation Feature Highlight */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FiGift className="h-8 w-8 text-red-500" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Food Donation Network
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Connect with local communities, shelters, and food banks to donate surplus food. 
                Our platform makes it easy to find donation opportunities and track your impact.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Find local donation centers</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Schedule pickups and deliveries</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Track your donation impact</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Earn rewards for donations</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="mt-8 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <FiHeart className="h-5 w-5" />
                <span>Start Donating</span>
              </button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 p-8 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <FiUsers className="h-8 w-8 text-red-500 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Local Shelters</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Connect with nearby shelters</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <FiShield className="h-8 w-8 text-green-500 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Food Safety</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Quality verification system</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <FiZap className="h-8 w-8 text-yellow-500 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quick Matching</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Instant donor-recipient matching</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <FiStar className="h-8 w-8 text-purple-500 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Impact Tracking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">See your donation impact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real stories from real people making a difference
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of people already reducing food waste and helping their communities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="bg-white text-green-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </button>
            <button
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-500 transition-colors"
              onClick={() => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                  aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-4xl mx-auto py-16 px-4" style={{ scrollMarginTop: 80 }}>
        <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-lg p-8 mb-12 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-3xl font-bold mb-4 text-green-700 dark:text-green-300 flex items-center">
            <FiUser className="mr-2" /> About FoodGuard
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
            FoodGuard is an AI-powered food waste tracker developed by <span className="font-semibold">Kishor Rathod</span> and <span className="font-semibold">Basavanth</span>, students and aspiring full stack developers. Our mission is to help households and communities reduce food waste, save money, and contribute to a sustainable future. This project leverages modern web technologies and machine learning to provide smart inventory management, expiry alerts, and actionable insights.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            We believe in using technology for good and empowering users to make a positive impact on the environment and their daily lives.
          </p>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="max-w-4xl mx-auto py-12 px-4" style={{ scrollMarginTop: 80 }}>
        <div className="bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300 flex items-center">
            <FiMail className="mr-2" /> Contact Us
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Kishor Rathod</h3>
              <p className="text-gray-700 dark:text-gray-300">Full Stack Developer / Student</p>
              <div className="flex items-center space-x-3 mt-1">
                <a href="mailto:krr8088@gmail.com" className="flex items-center text-green-700 dark:text-green-300 hover:underline"><FiMail className="mr-1" />krr8088@gmail.com</a>
                <a href="https://www.linkedin.com/in/kishor-rathod-5873b0272" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-700 dark:text-blue-300 hover:underline"><FiLinkedin className="ml-2 mr-1" />LinkedIn</a>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Basavanth</h3>
              <p className="text-gray-700 dark:text-gray-300">Team Member</p>
              <a href="mailto:Basavanthh1111@gmail.com" className="flex items-center text-green-700 dark:text-green-300 hover:underline"><FiMail className="mr-1" />Basavanthh1111@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FiHome className="h-8 w-8 text-green-500" />
                <span className="text-xl font-bold">FoodGuard</span>
              </div>
              <p className="text-gray-400">
                Making food waste reduction easy, fun, and impactful for everyone.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Smart Tracking</li>
                <li>Food Donation</li>
                <li>Analytics</li>
                <li>Gamification</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Donation Centers</li>
                <li>Volunteer</li>
                <li>Partners</li>
                <li>Success Stories</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FoodGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 