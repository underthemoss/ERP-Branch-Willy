"use client";

import { ContactType, ProjectContactRelationEnum } from "@/graphql/graphql";
import { useListContactsQuery } from "@/graphql/hooks";
import { ChevronDown, Loader2, User, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RelationshipSelector } from "./RelationshipSelector";

export interface SelectedPerson {
  id: string;
  name: string;
  role?: string | null;
  profilePicture?: string | null;
  relationToProject: string;
}

interface PersonSelectorProps {
  workspaceId: string;
  selectedPersons: SelectedPerson[];
  onChange: (persons: SelectedPerson[]) => void;
  relationshipOptions: Array<{ code: string; description: string }>;
  maxSelections?: number;
  required?: boolean;
  error?: boolean;
}

export function PersonSelector({
  workspaceId,
  selectedPersons,
  onChange,
  relationshipOptions,
  maxSelections = 10,
  required = false,
  error = false,
}: PersonSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch person contacts
  const { data, loading } = useListContactsQuery({
    variables: {
      workspaceId,
      page: { number: 1, size: 100 },
      contactType: ContactType.Person,
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const persons = useMemo(() => {
    return (
      (data?.listContacts?.items
        ?.filter((c) => c?.__typename === "PersonContact")
        .map((c: any) => ({
          id: c?.id ?? "",
          name: c?.name ?? "",
          role: c?.role,
          profilePicture: c?.profilePicture,
        })) as Array<{
        id: string;
        name: string;
        role?: string | null;
        profilePicture?: string | null;
      }>) ?? []
    );
  }, [data]);

  // Filter persons based on search query and exclude already selected
  const filteredPersons = useMemo(() => {
    const availablePersons = persons.filter(
      (person) => !selectedPersons.some((sp) => sp.id === person.id),
    );

    if (!searchQuery.trim()) return availablePersons;

    const query = searchQuery.toLowerCase();
    return availablePersons.filter(
      (person) =>
        person.name.toLowerCase().includes(query) || person.role?.toLowerCase().includes(query),
    );
  }, [persons, searchQuery, selectedPersons]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredPersons.length]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // max-h-96 = 24rem = 384px
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldFlipUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldFlipUp
          ? rect.top + window.scrollY - dropdownHeight - 4
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position when opening or on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        if (selectedPersons.length < maxSelections) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredPersons.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredPersons[highlightedIndex]) {
          handleSelect(filteredPersons[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  const handleSelect = (person: {
    id: string;
    name: string;
    role?: string | null;
    profilePicture?: string | null;
  }) => {
    if (selectedPersons.length >= maxSelections) return;

    const newPerson: SelectedPerson = {
      id: person.id,
      name: person.name,
      role: person.role,
      profilePicture: person.profilePicture,
      relationToProject: "",
    };

    onChange([...selectedPersons, newPerson]);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleRemove = (personId: string) => {
    onChange(selectedPersons.filter((p) => p.id !== personId));
  };

  const handleRelationshipChange = (personId: string, relationship: string) => {
    onChange(
      selectedPersons.map((p) =>
        p.id === personId ? { ...p, relationToProject: relationship } : p,
      ),
    );
  };

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        marginTop: "4px",
      }}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search people..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          autoComplete="off"
        />
      </div>

      {/* Person List */}
      <div className="overflow-y-auto max-h-96">
        {loading ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading people...</p>
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="px-3 py-8 text-sm text-center text-gray-500">
            {searchQuery ? "No people match your search" : "No people available"}
          </div>
        ) : (
          <div className="py-1">
            {filteredPersons.map((person, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleSelect(person)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isHighlighted ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {/* Avatar */}
                  {person.profilePicture ? (
                    <img
                      src={person.profilePicture}
                      alt={person.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                  )}

                  {/* Person info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{person.name}</div>
                    {person.role && (
                      <div className="text-xs text-gray-500 truncate">{person.role}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      {/* Search input trigger */}
      <div ref={containerRef} className="relative">
        {selectedPersons.length > 0 ? (
          // Selected state - show count button
          <button
            type="button"
            onClick={() => selectedPersons.length < maxSelections && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={selectedPersons.length >= maxSelections}
            className={`w-full px-3 py-2 text-sm text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-between gap-2 ${
              selectedPersons.length >= maxSelections
                ? "opacity-50 cursor-not-allowed"
                : "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-700">
                {selectedPersons.length} {selectedPersons.length === 1 ? "person" : "people"}{" "}
                selected
              </span>
            </div>
            {selectedPersons.length < maxSelections && (
              <ChevronDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
          </button>
        ) : (
          // Empty state - show search field
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 text-sm text-left bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors flex items-center justify-between gap-2 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
          >
            <span className="text-gray-500 flex-1">Search people to add...</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        )}
      </div>

      {/* Selected persons list */}
      {selectedPersons.length > 0 && (
        <div className="space-y-2">
          {selectedPersons.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            >
              {/* Avatar */}
              {person.profilePicture ? (
                <img
                  src={person.profilePicture}
                  alt={person.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-600">{person.name[0]}</span>
                </div>
              )}

              {/* Person info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{person.name}</div>
                {person.role && <div className="text-xs text-gray-500 truncate">{person.role}</div>}
              </div>

              {/* Relationship selector */}
              <div className="min-w-[200px]">
                <RelationshipSelector
                  value={person.relationToProject}
                  onChange={(relationship) => handleRelationshipChange(person.id, relationship)}
                  options={relationshipOptions}
                  placeholder="Select relationship..."
                  error={!person.relationToProject}
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(person.id)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="Remove person"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {selectedPersons.length} of {maxSelections} contacts selected
        {selectedPersons.some((p) => !p.relationToProject) && (
          <span className="text-red-600 ml-2">• All contacts must have a relationship type</span>
        )}
      </p>

      {/* Render dropdown via portal */}
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}
