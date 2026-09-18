import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Plan from '../components/Plan';
import AiTools from '../components/AiTools';
import Testimonial from '../components/Testimonial';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="bg-gray-50 font-sans relative">
      <Navbar />
      <Hero />
      <AiTools />
      <Testimonial />
      <Plan />
      <Footer />
    </div>
  );
};

export default Home;