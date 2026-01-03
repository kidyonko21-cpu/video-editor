'use client';

import { useState, useEffect } from 'react';
import { UploadButton } from '@uploadthing/react';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, Play, Download, Film, Wand2, Clock, DollarSign,
  CheckCircle, AlertCircle
} from 'lucide-react';

export default function VideoEditor() {
  const [videoUrl, setVideoUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [jobStatus, setJobStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [jobId, setJobId] = useState('');
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('credits')
          .eq('id', session.user.id)
          .single();
        setCredits(data?.credits || 0);
      }
    };
    init();
  }, []);

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) console.error(error);
  };

  const startEdit = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    if (credits < 1) {
      alert('No credits. Purchase more to continue.');
      return;
    }

    setJobStatus('processing');

    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, prompt })
    });

    const { jobId: id } = await res.json();
    setJobId(id);

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('jobs')
        .select('status, result_url')
        .eq('id', id)
        .single();

      if (data?.status === 'completed') {
        setJobStatus('completed');
        setVideoUrl(data.result_url);
        clearInterval(interval);
      } else if (data?.status === 'failed') {
        setJobStatus('failed');
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <nav className="flex justify-between items-center p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Film className="w-6 h-6 text-blue-400" />
          <span className="text-2xl font-bold">AI Video Pro</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm">Credits: <span className="font-bold text-green-400">{credits}</span></span>
              <button 
                onClick={() => window.location.href = '/pricing'}
                className="flex items-center gap-1 bg-green-600 px-3 py-1 rounded hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4" /> Buy More
              </button>
            </>
          ) : (
            <button onClick={handleSignIn} className="bg-blue-600 px-4 py-2 rounded">
              Sign In
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">Edit Video With AI</h1>
          <p className="text-gray-400 text-lg">Upload. Describe. Download. No editing skills needed.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-400" /> 1. Upload Video
            </h2>
            <UploadButton
              endpoint="videoUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]?.url) setVideoUrl(res[0].url);
              }}
              appearance={{
                button: "bg-blue-600 px-4 py-2 rounded w-full",
                container: "w-full"
              }}
            />
            {videoUrl && (
              <video src={videoUrl} controls className="w-full rounded mt-4" />
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-400" /> 2. Describe Edit
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Examples:
- Remove the coffee cup from the table
- Make the sky more dramatic and orange
- Cut all silences longer than 2 seconds
- Stabilize the shaky footage and zoom in 1.5x`}
              className="w-full p-4 bg-gray-900 border border-gray-600 rounded h-32 resize-none focus:outline-none focus:border-blue-500"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <span>Cost: <span className="text-green-400 font-bold">1 credit</span></span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 1-3 minutes
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={startEdit}
            disabled={!videoUrl || !prompt || jobStatus === 'processing'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-lg text-xl font-bold flex items-center gap-3 mx-auto disabled:opacity-50 hover:from-blue-700 hover:to-purple-700"
          >
            {jobStatus === 'processing' && <Loader2 className="animate-spin" />}
            {jobStatus === 'completed' && <CheckCircle className="text-green-400" />}
            {jobStatus === 'failed' && <AlertCircle className="text-red-400" />}
            {jobStatus === 'idle' && 'Start Editing →'}
            {jobStatus === 'processing' && 'Editing Video...'}
            {jobStatus === 'completed' && 'Download Ready!'}
            {jobStatus === 'failed' && 'Try Again'}
          </button>
        </div>

        {jobStatus === 'processing' && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-blue-900 bg-opacity-50 px-6 py-3 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span>Processing your video... This takes 1-3 minutes</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Job ID: {jobId}</p>
          </div>
        )}

        {jobStatus === 'completed' && (
          <div className="mt-8 bg-gray-800 p-6 rounded-xl border border-green-700">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" /> Your Video is Ready!
            </h2>
            <video src={videoUrl} controls className="w-full rounded mb-4" />
            <a
              href={videoUrl}
              download
              className="inline-flex items-center gap-2 bg-green-600 px-6 py-3 rounded font-bold hover:bg-green-700"
            >
              <Download className="w-5 h-5" /> Download HD Video
            </a>
          </div>
        )}
      </div>
    </main>
  );
}