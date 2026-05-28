import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { Upload, Trash2, Image, ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FramesPage() {
  const { franchiseeId, isSuper } = useAuth();
  const [frames, setFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (franchiseeId) fetchFrames();
  }, [franchiseeId, isSuper]);

  const fetchFrames = async () => {
    setIsLoading(true);
    let query = supabase.from('frames').select('*').order('created_at', { ascending: false });
    if (!isSuper) query = query.eq('franchisee_id', franchiseeId);
    const { data } = await query;
    setFrames(data || []);
    setIsLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('png')) {
      setUploadMessage({ type: 'error', text: 'Only PNG files are allowed for transparent frames.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      // 1. Upload to Supabase Storage
      const filePath = `${franchiseeId}/frames/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('frames')
        .upload(filePath, file, { contentType: 'image/png', upsert: false });

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: urlData } = supabase.storage.from('frames').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 3. Save to database
      const { error: dbError } = await supabase.from('frames').insert({
        franchisee_id: franchiseeId,
        name: file.name.replace('.png', ''),
        storage_url: publicUrl,
        is_active: true,
      });

      if (dbError) throw dbError;

      setUploadMessage({ type: 'success', text: `"${file.name}" uploaded successfully!` });
      fetchFrames();
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({ type: 'error', text: err.message || 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFrame = async (frame) => {
    const { error } = await supabase
      .from('frames')
      .update({ is_active: !frame.is_active })
      .eq('id', frame.id);

    if (!error) {
      setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, is_active: !f.is_active } : f));
    }
  };

  const deleteFrame = async (frame) => {
    if (!confirm(`Delete "${frame.name}"? This cannot be undone.`)) return;

    try {
      // Extract the storage path from the URL
      const url = new URL(frame.storage_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/frames/');
      const storagePath = pathParts[1];

      if (storagePath) {
        await supabase.storage.from('frames').remove([decodeURIComponent(storagePath)]);
      }

      const { error } = await supabase.from('frames').delete().eq('id', frame.id);
      if (!error) {
        setFrames(prev => prev.filter(f => f.id !== frame.id));
        setUploadMessage({ type: 'success', text: `"${frame.name}" deleted.` });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setUploadMessage({ type: 'error', text: 'Failed to delete frame.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-[3px] border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Frame Manager</h1>
          <p className="text-gray-500 font-medium mt-1">Upload and manage custom photo frame overlays</p>
        </div>

        {/* Upload Button */}
        <label className={`
          flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm cursor-pointer
          transition-all duration-200 active:scale-[0.97]
          ${isUploading 
            ? 'bg-white/10 text-gray-400 cursor-wait' 
            : 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/10'
          }
        `}>
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Frame'}
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".png" 
            onChange={handleUpload} 
            className="hidden" 
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium border ${
          uploadMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {uploadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {uploadMessage.text}
        </div>
      )}

      {/* Frames Grid */}
      {frames.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Image className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400">No Frames Uploaded</h3>
          <p className="text-sm text-gray-600 mt-2">Upload transparent PNG frames for your kiosk machines.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {frames.map((frame) => (
            <div 
              key={frame.id} 
              className={`glass-card overflow-hidden group transition-all duration-300 ${
                !frame.is_active ? 'opacity-50' : 'hover:border-white/[0.15]'
              }`}
            >
              {/* Preview */}
              <div className="relative aspect-[3/4] bg-[#111] flex items-center justify-center overflow-hidden">
                {/* Checkerboard background to show transparency */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }} />
                <img 
                  src={frame.storage_url} 
                  alt={frame.name}
                  className="relative z-10 w-full h-full object-contain p-2"
                  loading="lazy"
                />
                
                {/* Inactive overlay */}
                {!frame.is_active && (
                  <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inactive</span>
                  </div>
                )}
              </div>

              {/* Info & Controls */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white truncate">{frame.name}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(frame.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  {/* Toggle Active */}
                  <button 
                    onClick={() => toggleFrame(frame)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                      frame.is_active 
                        ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
                        : 'text-gray-500 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                  >
                    {frame.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {frame.is_active ? 'Active' : 'Inactive'}
                  </button>

                  {/* Delete */}
                  <button 
                    onClick={() => deleteFrame(frame)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                    title="Delete frame"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
