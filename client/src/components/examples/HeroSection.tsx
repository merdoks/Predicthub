import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection 
      onCreateMarket={() => console.log('Create market clicked')}
      onBrowseMarkets={() => console.log('Browse markets clicked')}
    />
  );
}
