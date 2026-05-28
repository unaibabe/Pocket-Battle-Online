import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Mock validation
        if (username.trim() !== '' && password.trim() !== '') {
            setError('');
            onLogin(username);
        } else {
            setError('Please fill all fields.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-2xl shadow-primary/10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">
                        Pocket Battle <span className="text-primary">Online</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">Log in with your Trainer account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g., TrainerRed"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-muted-foreground">Password</label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="w-full font-bold bg-primary hover:bg-primary/90">Login</Button>
                </form>
            </div>
        </div>
    );
}

export default Login;