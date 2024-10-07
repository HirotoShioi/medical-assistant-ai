import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invokeAgent } from "@/lib/ai/agent";

function AgentPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;
    console.log(message);
    invokeAgent(message);
  };
  return (
    <div>
      <h1>Agent</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input type="text" name="message" />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}

export default AgentPage;
