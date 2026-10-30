"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton, Modal, ConfirmationModal, Input, Toast } from "@/components/ui";
import { Users, Plus, Sparkles, Image as ImageIcon, Trash2, Edit2, Eye } from "lucide-react";
import { apiClient, Character } from "@/lib/api";

export default function CharacterLibraryPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Edit / Rename State
  const [renameChar, setRenameChar] = useState<Character | null>(null);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Delete Confirmation State
  const [deleteChar, setDeleteChar] = useState<Character | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Preview Modal State
  const [previewChar, setPreviewChar] = useState<Character | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchCharacters = async () => {
    try {
      const data = await apiClient.characters.list();
      setCharacters(data);
    } catch (err) {
      console.error("Failed to load characters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setToastMessage({ type: "error", text: "Please upload a valid image file (PNG, JPG, WEBP)." });
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      if (!newCharName) setNewCharName(file.name.split(".")[0]);
    }
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setToastMessage(null);

    try {
      await apiClient.characters.uploadImage(
        selectedFile,
        newCharName || selectedFile.name.split(".")[0]
      );

      setNewCharName("");
      setSelectedFile(null);
      setFilePreview(null);
      setToastMessage({ type: "success", text: "Character model uploaded and saved successfully!" });
      fetchCharacters();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to save character." });
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async () => {
    if (!renameChar || !editName.trim()) return;

    setRenaming(true);
    try {
      await apiClient.characters.update(renameChar.id, { name: editName });
      setToastMessage({ type: "success", text: "Character renamed successfully." });
      setRenameChar(null);
      fetchCharacters();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to rename character." });
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteChar) return;

    setDeleting(true);
    try {
      await apiClient.characters.delete(deleteChar.id);
      setToastMessage({ type: "success", text: "Character deleted successfully." });
      setDeleteChar(null);
      fetchCharacters();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to delete character." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Character Library
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Upload, preview, rename, and manage custom character avatars for AI video replacement and 3D CGI video generation.
          </p>
        </div>

        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.text}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* UPLOAD PANEL */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-400" />
            Upload New Character Reference Model
          </h3>

          <form onSubmit={handleAddCharacter} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="Character Name"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="e.g. Tactical Operator"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Character Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-[#0a0e17] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 cursor-pointer"
              />
            </div>

            <Button type="submit" isLoading={uploading} disabled={!selectedFile} className="w-full">
              <Plus className="w-4 h-4 mr-1.5" />
              Save to Library
            </Button>
          </form>

          {filePreview && (
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-4">
              <img src={filePreview} alt="Upload Preview" className="w-16 h-16 rounded-lg object-cover border border-slate-700 bg-slate-900" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold block">{selectedFile?.name}</span>
                <span className="text-slate-500">{(selectedFile!.size / 1024 / 1024).toFixed(2)} MB &bull; Ready for upload</span>
              </div>
            </div>
          )}
        </Card>

        {/* GALLERY */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : characters.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-slate-800">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Character Models Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              Upload character photos above to build your private avatar library for AI video renders.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((c) => (
              <Card key={c.id} className="p-4 space-y-3 flex flex-col justify-between hover:border-violet-500/50 transition-all group">
                <div>
                  <div className="h-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-3 relative group">
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewChar(c)}
                        className="p-2 bg-slate-900/90 hover:bg-violet-600 text-white rounded-lg transition-colors"
                        title="Preview Full Image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setRenameChar(c);
                          setEditName(c.name);
                        }}
                        className="p-2 bg-slate-900/90 hover:bg-violet-600 text-white rounded-lg transition-colors"
                        title="Rename Character"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm truncate">{c.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Uploaded {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <Link href={`/create?character_id=${c.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-400" />
                      Use in Creator
                    </Button>
                  </Link>
                  <button
                    onClick={() => setDeleteChar(c)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete Character"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* FULL IMAGE PREVIEW MODAL */}
        {previewChar && (
          <Modal
            isOpen={!!previewChar}
            onClose={() => setPreviewChar(null)}
            title={`Character Preview — ${previewChar.name}`}
          >
            <div className="p-2 bg-slate-950 rounded-xl overflow-hidden flex justify-center">
              <img src={previewChar.image_url} alt={previewChar.name} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </Modal>
        )}

        {/* RENAME MODAL */}
        {renameChar && (
          <Modal
            isOpen={!!renameChar}
            onClose={() => setRenameChar(null)}
            title="Rename Character Model"
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setRenameChar(null)}>
                  Cancel
                </Button>
                <Button size="sm" isLoading={renaming} onClick={handleRename}>
                  Save Name
                </Button>
              </>
            }
          >
            <Input
              label="New Character Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </Modal>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        <ConfirmationModal
          isOpen={!!deleteChar}
          onClose={() => setDeleteChar(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Character Avatar"
          message={`Are you sure you want to delete '${deleteChar?.name}'? This action cannot be undone.`}
          confirmText="Delete Avatar"
          isLoading={deleting}
        />
      </div>
    </AppLayout>
  );
}
