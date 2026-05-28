import { ThemeToggle } from '../components/ui/ThemeToggle';

function Profile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="text-muted-foreground mt-2">User statistics and collection will be here.</p>
    </div>
  );
}

export default Profile;
