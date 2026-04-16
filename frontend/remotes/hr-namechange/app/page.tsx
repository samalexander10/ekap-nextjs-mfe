import NameChangeForm from "../src/components/NameChangeForm";

export default function RemotePage() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Name Change Request</h1>
      <NameChangeForm />
    </div>
  );
}
