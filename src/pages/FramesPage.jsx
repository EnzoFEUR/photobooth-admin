import { useState, useRef, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Loader from '../components/ui/Loader';
import { Upload, Trash2, Image as ImageIcon, ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const STUDIO_LAYOUTS = [
  { id: 'strip-4', label: 'Classic Strip 4' },
  { id: 'strip-4-flipped', label: 'Flipped Strip 4' },
  { id: 'strip-horizontal', label: 'Horizontal Strip' },
  { id: 'vintage-strip', label: 'Vintage Strip' },
  { id: 'grid-4', label: 'Grid 4' },
  { id: 'grid-6', label: 'Grid 6' },
  { id: 'multi-frame-6', label: 'Multi-frame 6' },
  { id: 'landscape-2', label: 'Landscape 2' },
  { id: 'landscape-3', label: 'Landscape 3' },
  { id: 'mini-strip-8', label: 'Mini Strip 8' }
];

const getTargetLayoutId = (frameName) => {
  const normalizedFrameName = frameName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sortedLayouts = [...STUDIO_LAYOUTS].sort((a, b) => b.id.length - a.id.length);
  for (const layout of sortedLayouts) {
    const normalizedLayoutId = layout.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedFrameName.includes(normalizedLayoutId)) {
      return layout.id;
    }
  }
  return 'universal';
};

export default function FramesPage() {
  const { franchiseeId, isSuper } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const fileInputRef = useRef(null);

  const { data: frames = [], isLoading } = useQuery({
    queryKey: ['frames', franchiseeId],
    queryFn: async () => {
      let query = supabase.from('frames').select('*').order('created_at', { ascending: false });
      if (!isSuper) query = query.eq('franchisee_id', franchiseeId);
      const { data } = await query;
      return data || [];
    },
    enabled: !!franchiseeId,
  });

  const groupedFrames = useMemo(() => {
    const groups = { 'universal': [] };
    STUDIO_LAYOUTS.forEach(l => groups[l.id] = []);
    
    frames.forEach(frame => {
      const layoutId = getTargetLayoutId(frame.name);
      if (!groups[layoutId]) groups[layoutId] = [];
      groups[layoutId].push(frame);
    });
    
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([id, items]) => ({
        id,
        label: id === 'universal' ? 'Universal Frames (All Layouts)' : STUDIO_LAYOUTS.find(l => l.id === id)?.label || id,
        items
      }));
  }, [frames]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      setUploadMessage({ type: 'error', text: 'Only PNG files are allowed for transparent frames.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const filePath = `${franchiseeId}/frames/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('frames')
        .upload(filePath, file, { contentType: 'image/png', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('frames').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('frames').insert({
        franchisee_id: franchiseeId,
        name: file.name.replace('.png', ''),
        storage_url: urlData.publicUrl,
        is_active: true,
      });

      if (dbError) throw dbError;

      setUploadMessage({ type: 'success', text: `"${file.name}" uploaded successfully!` });
      queryClient.invalidateQueries(['frames']);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({ type: 'error', text: err.message || 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleFrame = async (frame) => {
    // Optimistic update
    queryClient.setQueryData(['frames', franchiseeId], old => 
      old.map(f => f.id === frame.id ? { ...f, is_active: !f.is_active } : f)
    );
    await supabase.from('frames').update({ is_active: !frame.is_active }).eq('id', frame.id);
    queryClient.invalidateQueries(['frames']);
  };

  const deleteFrame = async (frame) => {
    if (!confirm(`Delete "${frame.name}"? This cannot be undone.`)) return;

    try {
      const url = new URL(frame.storage_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/frames/');
      if (pathParts[1]) {
        await supabase.storage.from('frames').remove([decodeURIComponent(pathParts[1])]);
      }

      await supabase.from('frames').delete().eq('id', frame.id);
      setUploadMessage({ type: 'success', text: `"${frame.name}" deleted.` });
      queryClient.invalidateQueries(['frames']);
    } catch (err) {
      console.error('Delete error:', err);
      setUploadMessage({ type: 'error', text: 'Failed to delete frame.' });
    }
  };

  if (isLoading) {
    return <Loader message="Loading frames..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Frame Manager</h1>
          <p className="text-sm text-zinc-500 mt-1">Organized automatically based on file name</p>
        </div>

        <label className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm cursor-pointer transition-colors
          ${isUploading 
            ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
            : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-200'
          }
        `}>
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {isUploading ? 'Uploading...' : 'Upload Frame'}
          <input ref={fileInputRef} type="file" accept=".png" onChange={handleUpload} className="hidden" disabled={isUploading} />
        </label>
      </div>

      {uploadMessage && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium border ${
          uploadMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {uploadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {uploadMessage.text}
        </div>
      )}

      {frames.length === 0 ? (
        <div className="bg-[#111113] border border-zinc-800 rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-400">No Frames Uploaded</h3>
          <p className="text-sm text-zinc-600 mt-2">Upload transparent PNG frames. Include 'strip-4' or 'grid-6' in the name to auto-organize!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedFrames.map(group => (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <h3 className="text-base font-medium text-zinc-200">{group.label}</h3>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-medium text-zinc-400">{group.items.length}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {group.items.map((frame) => (
                  <div 
                    key={frame.id} 
                    className={`bg-[#111113] border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors ${!frame.is_active ? 'opacity-50' : ''}`}
                  >
                    <div className="relative aspect-[3/4] bg-[#111] flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      }} />
                      <img src={frame.storage_url} alt={frame.name} className="relative z-10 w-full h-full object-contain p-2" loading="lazy" />
                      {!frame.is_active && (
                        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Inactive</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-50 truncate">{frame.name}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{new Date(frame.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => toggleFrame(frame)}
                          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                            frame.is_active ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-zinc-500 bg-zinc-800 hover:bg-zinc-700'
                          }`}
                        >
                          {frame.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {frame.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button onClick={() => deleteFrame(frame)} className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-red-500/10" title="Delete frame">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
