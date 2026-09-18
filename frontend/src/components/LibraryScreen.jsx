import { useEffect, useState } from "react";
import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import { api } from "../api";
import { c, radius } from "../theme";
import AddNewExerciseForm from "./AddNewExerciseForm";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ExercisePreviewModal from "./ExercisePreviewModal";
import ThumbPlaceholder from "./ThumbPlaceholder";

const PAGE_SIZE = 10;

export default function LibraryScreen() {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [results, setResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState({ muscle_groups: [], equipment: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState(null);

  const refresh = () => {
    api.getExercises({ q: query, muscleGroup: muscleFilter, equipment: equipmentFilter }).then(setResults);
  };

  useEffect(() => {
    api.getExerciseFilters().then(setFilters);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    const handle = setTimeout(refresh, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, muscleFilter, equipmentFilter]);

  const clearFilters = () => {
    setMuscleFilter("");
    setEquipmentFilter("");
  };

  const addEntry = async (formData) => {
    await api.createExercise(formData);
    api.getExerciseFilters().then(setFilters);
    refresh();
  };

  const confirmDelete = async () => {
    await api.deleteExercise(deleteTarget);
    setDeleteTarget(null);
    refresh();
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditValue(entry.name);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const saveEdit = async (id) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditError("Name can't be empty.");
      return;
    }
    try {
      await api.updateExerciseName(id, trimmed);
      setEditingId(null);
      refresh();
    } catch (e) {
      setEditError(e.message);
    }
  };

  const pillSelectStyle = (active) => ({
    background: active ? c.mauve : c.paleMauve,
    color: active ? "#fff" : c.mauveDeep,
    border: active ? "none" : `1px solid ${c.mauveSoft}`,
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 500,
  });

  return (
    <div className="wio-fill">
      <div style={{ background: c.primary, borderRadius: radius.md, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginBottom: 10 }}>Exercise library</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#2a2a30", borderRadius: radius.sm, padding: "8px 12px", marginBottom: 10 }}>
          <Search size={15} color={c.mauveSoft} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or muscle group…"
            style={{ border: "none", background: "transparent", fontSize: 13, color: "#fff", flex: 1, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={clearFilters} style={{ ...pillSelectStyle(!muscleFilter && !equipmentFilter), border: "none", cursor: "pointer" }}>
            All
          </button>
          <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} style={{ ...pillSelectStyle(!!muscleFilter), cursor: "pointer" }}>
            <option value="">Muscle group</option>
            {filters.muscle_groups.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)} style={{ ...pillSelectStyle(!!equipmentFilter), cursor: "pointer" }}>
            <option value="">Equipment</option>
            {filters.equipment.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: c.canvas, borderRadius: radius.md, border: `1px solid ${c.hairline}`, overflow: "hidden", marginBottom: 12 }}>
        {results.slice(0, visibleCount).map((entry, i, visible) => (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < visible.length - 1 ? `1px solid ${c.hairline}` : "none" }}>
            <div onClick={() => setPreviewId(entry.id)} style={{ cursor: "pointer" }}>
              <ThumbPlaceholder photoUrl={api.photoUrl(entry.photo_url)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingId === entry.id ? (
                <div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(entry.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      style={{ flex: 1, border: `1px solid ${c.mauveSoft}`, borderRadius: radius.xs, padding: "5px 8px", fontSize: 13, color: c.ink }}
                    />
                    <Check size={16} color={c.mauve} style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => saveEdit(entry.id)} />
                    <X size={16} color={c.muted} style={{ cursor: "pointer", flexShrink: 0 }} onClick={cancelEdit} />
                  </div>
                  {editError && <div style={{ fontSize: 10, color: c.mauve, marginTop: 4 }}>{editError}</div>}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: c.ink }}>{entry.full_name}</div>
                  <div style={{ fontSize: 10, color: c.muted }}>{entry.muscle_group}</div>
                </>
              )}
            </div>
            {editingId !== entry.id && (
              <>
                <Pencil size={15} color={c.muted} style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => startEdit(entry)} />
                <Trash2 size={15} color={c.mauve} style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setDeleteTarget(entry.id)} />
              </>
            )}
          </div>
        ))}
        {results.length === 0 && <div style={{ padding: 16, fontSize: 12, color: c.muted, textAlign: "center" }}>No exercises match your search or filters.</div>}
      </div>

      {visibleCount < results.length && (
        <button
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          style={{ width: "100%", background: c.canvas, border: `1px solid ${c.hairline}`, borderRadius: radius.md, padding: "10px 16px", marginBottom: 12, fontSize: 13, color: c.mauve, fontWeight: 500, cursor: "pointer" }}
        >
          Show 10 more ({results.length - visibleCount} left)
        </button>
      )}

      <AddNewExerciseForm onAdd={addEntry} />

      {deleteTarget && (
        <DeleteConfirmModal
          message="Are you sure you want to delete this? This can't be undone."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {previewId && <ExercisePreviewModal exerciseId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
