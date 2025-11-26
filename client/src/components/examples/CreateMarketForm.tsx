import CreateMarketForm from '../CreateMarketForm';

export default function CreateMarketFormExample() {
  return (
    <div className="p-6">
      <CreateMarketForm 
        onSubmit={(market) => console.log('Market created:', market)}
        onCancel={() => console.log('Cancelled')}
      />
    </div>
  );
}
