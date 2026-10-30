"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton } from "@/components/ui";
import { Users, Plus, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";

export default function CharacterLibraryPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchCharacters = async () => {
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("http://localhost:8000/api/characters", { headers });
      if (res.ok) {
        setCharacters(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fakeImageUrl = URL.createObjectURL(selectedFile);

      await fetch("http://localhost:8000/api/characters", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newCharName || selectedFile.name.split(".")[0],
          image_url: fakeImageUrl
        })
      });

      setNewCharName("");
      setSelectedFile(null);
      fetchCharacters();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`http://localhost:8000/api/characters/${id}`, {
        method: "DELETE",
        headers
      });
      fetchCharacters();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Character Library
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload and manage custom character avatars for AI video replacement and 3D generation.
            </p>
          </div>
        </div>

        <Card>
          <h3 className="text-sm font-bold text-slate-200 mb-3">Upload New Character Reference</h3>
          <form onSubmit={handleAddCharacter} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-400">Character Name</label>
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="e.g. Tactical Operator"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-400">Select Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200"
              />
            </div>

            <Button type="submit" isLoading={uploading} disabled={!selectedFile}>
              <Plus className="w-4 h-4 mr-1" />
              Save Character
            </Button>
          </form>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : characters.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Characters Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Upload character images above to start generating personalized CGI videos.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((c) => (
              <Card key={c.id} className="p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="h-48 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 mb-3 relative group">
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm truncate">{c.name}</h4>
                  <p className="text-[10px] text-slate-400">Uploaded {new Date(c.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <Link href={`/create?character_id=${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Sparkles className="w-3 h-3 mr-1 text-violet-400" />
                      Use in Video
                    </Button>
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
