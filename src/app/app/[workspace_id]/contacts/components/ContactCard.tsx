"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface ContactCardProps {
  contact: {
    id: string;
    name: string;
    type: string;
    phone?: string;
    email?: string;
    role?: string;
    address?: string;
    website?: string;
    profilePicture?: string;
    updatedAt?: string;
    brand?: {
      name?: string | null;
      logos?: Array<{
        type?: string | null;
        theme?: string | null;
        formats?: Array<{
          src?: string | null;
          format?: string | null;
          width?: number | null;
          height?: number | null;
        } | null> | null;
      } | null> | null;
    } | null;
    __typename?: string;
  };
  workspaceId: string;
}

export function ContactCard({ contact, workspaceId }: ContactCardProps) {
  const router = useRouter();
  const isPerson = contact.type === "PERSON";
  const isBusiness = contact.type === "BUSINESS";

  const businessLogo =
    isBusiness && contact.brand
      ? contact.brand?.logos?.find((l) => l?.type === "logo")?.formats?.[0]?.src
      : null;
  const logoTheme =
    isBusiness && contact.brand
      ? contact.brand?.logos?.find((l) => l?.type === "logo")?.theme
      : null;

  const initials = contact.name
    ?.split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleClick = () => {
    router.push(`/app/${workspaceId}/contacts/${contact.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/app/${workspaceId}/contacts/${contact.id}/edit`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isPerson ? "border-purple-200 hover:border-purple-400" : "border-blue-200 hover:border-blue-400"}
      `}
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Avatar/Logo Section */}
        <div className="flex justify-center mb-4">
          <div
            className={`
              relative w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold
              transition-transform duration-300 group-hover:scale-110
              ${
                businessLogo
                  ? logoTheme === "dark"
                    ? "bg-white border-2 border-gray-200"
                    : logoTheme === "light"
                      ? "bg-gray-900"
                      : "bg-white border-2 border-gray-200"
                  : isPerson
                    ? "bg-gradient-to-br from-purple-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-blue-600"
              }
            `}
          >
            {businessLogo || contact.profilePicture ? (
              <img
                src={businessLogo || contact.profilePicture || undefined}
                alt={contact.name}
                className="w-full h-full rounded-full object-contain p-2"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        </div>

        {/* Contact Name */}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2 line-clamp-1">
          {contact.name}
        </h3>

        {/* Type Badge */}
        <div className="flex justify-center mb-4">
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
              ${isPerson ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}
            `}
          >
            {isPerson ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
            {isPerson ? "Person" : "Business"}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2.5 min-h-[120px]">
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}

          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}

          {contact.role && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.role}</span>
            </div>
          )}

          {contact.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{contact.address}</span>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {contact.updatedAt && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Updated {formatDistanceToNow(parseISO(contact.updatedAt), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div
        className="
          absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          rounded-b-xl p-4 flex justify-center gap-2
        "
      >
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          View
        </button>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
