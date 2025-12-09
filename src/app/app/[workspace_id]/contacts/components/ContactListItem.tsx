"use client";

import { formatDistanceToNow, parseISO } from "date-fns";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

interface ContactListItemProps {
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

export function ContactListItem({ contact, workspaceId }: ContactListItemProps) {
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
        group bg-white rounded-lg border transition-all duration-200 cursor-pointer
        hover:shadow-md
        ${isPerson ? "border-purple-200 hover:border-purple-400" : "border-blue-200 hover:border-blue-400"}
      `}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Avatar/Logo */}
        <div
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0
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
              className="w-full h-full rounded-full object-contain p-1.5"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 truncate">{contact.name}</h3>
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0
                ${isPerson ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}
              `}
            >
              {isPerson ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {isPerson ? "Person" : "Business"}
            </span>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
            {contact.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}

            {contact.role && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.role}</span>
              </div>
            )}

            {contact.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{contact.address}</span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          {contact.updatedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Updated {formatDistanceToNow(parseISO(contact.updatedAt), { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <button
            onClick={handleClick}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            View
          </button>
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
