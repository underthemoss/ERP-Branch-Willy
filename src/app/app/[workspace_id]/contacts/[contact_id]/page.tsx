"use client";

import { graphql } from "@/graphql";
import {
  useContactDisplayPage_DeleteContactMutation,
  useContactDisplayPage_GetContactByIdQuery,
} from "@/graphql/hooks";
import BusinessLocationMap from "@/ui/contacts/BusinessLocationMap";
import NotesSection from "@/ui/notes/NotesSection";
import ReferenceNumbersSection from "@/ui/reference-numbers/ReferenceNumbersSection";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// --- GraphQL queries and mutations for this component ---
graphql(`
  query ContactDisplayPage_GetContactById($id: ID!) {
    getContactById(id: $id) {
      __typename
      ... on PersonContact {
        id
        name
        phone
        notes
        email
        role
        businessId
        resourceMapIds
        createdAt
        updatedAt
        resource_map_entries {
          path
        }
        business {
          id
          name
          phone
          address
          website
          brandId
          brand {
            id
            name
            domain
            logos {
              type
              theme
              formats {
                src
                width
                height
              }
            }
            images {
              type
              formats {
                src
                width
                height
              }
            }
          }
          employees {
            items {
              id
              name
              email
              role
              phone
            }
          }
        }
      }
      ... on BusinessContact {
        id
        name
        phone
        notes
        address
        taxId
        website
        brandId
        brand {
          id
          name
          domain
          logos {
            type
            theme
            formats {
              src
              width
              height
            }
          }
          images {
            type
            formats {
              src
              width
              height
            }
          }
        }
        createdAt
        updatedAt
        resource_map_entries {
          path
        }
        employees {
          items {
            id
            name
            email
            role
            phone
          }
        }
      }
    }
  }
`);

graphql(`
  mutation ContactDisplayPage_DeleteContact($id: ID!) {
    deleteContactById(id: $id)
  }
`);

export default function ContactDisplayPage() {
  const { contact_id, workspace_id } = useParams<{
    contact_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteContact] = useContactDisplayPage_DeleteContactMutation();
  const [deleting, setDeleting] = React.useState(false);
  const { data, loading, error } = useContactDisplayPage_GetContactByIdQuery({
    variables: { id: contact_id },
    fetchPolicy: "cache-and-network",
  });

  const contact = data?.getContactById;
  const isPerson = contact?.__typename === "PersonContact";
  const isBusiness = contact?.__typename === "BusinessContact";

  // Helper to format ISO date strings
  function formatDate(dateString?: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Get brand from either business contact directly or from person's business
  const brand =
    isBusiness && contact.brand
      ? contact.brand
      : isPerson && contact.business?.brand
        ? contact.business.brand
        : null;

  const employeeCount = isBusiness && contact.employees ? contact.employees.items.length : 0;

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <p className="text-gray-600">Loading contact details...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <p className="text-red-600">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LinkedIn-Style Header with Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl">
          {/* Brand Banner */}
          {brand?.images?.find((img: any) => img.type === "banner") && (
            <div className="relative">
              <div className="relative h-52 bg-gradient-to-r from-blue-500 to-blue-600">
                <img
                  src={brand.images.find((img: any) => img.type === "banner")?.formats?.[0]?.src}
                  alt={`${brand.name} banner`}
                  className="w-full h-full object-cover"
                />
                {brand?.logos?.find((logo: any) => logo.type === "logo") && (
                  <div
                    className={`absolute -bottom-12 left-8 w-24 h-24 rounded-full border-4 border-white shadow-xl flex items-center justify-center ${
                      brand.logos.find((logo: any) => logo.type === "logo")?.theme === "dark"
                        ? "bg-white"
                        : "bg-gray-900"
                    }`}
                  >
                    <img
                      src={brand.logos.find((logo: any) => logo.type === "logo")?.formats?.[0]?.src}
                      alt={`${brand.name} logo`}
                      className="w-full h-full object-contain rounded-full p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header Content */}
          <div
            className={`px-6 ${brand?.images?.find((img: any) => img.type === "banner") && brand?.logos?.find((logo: any) => logo.type === "logo") ? "pt-16" : "pt-6"} pb-6`}
          >
            {/* Top Row: Name, Badge, and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
                  <CheckCircle2 className="w-6 h-6 text-[#0A66C2]" />
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      isPerson ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isPerson ? "Person" : "Business"}
                  </span>
                </div>
                {/* Additional info line */}
                {isBusiness && contact.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{contact.address.split(",")[0]}</span>
                  </div>
                )}
                {isBusiness && employeeCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Users className="w-4 h-4" />
                    <span>{employeeCount} employees</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  className="px-6 py-2 border-2 border-[#0A66C2] text-[#0A66C2] rounded-full hover:bg-blue-50 transition-colors font-semibold text-sm"
                  data-testid="edit-contact"
                  onClick={() => router.push(`/app/${workspace_id}/contacts/${contact.id}/edit`)}
                >
                  Edit
                </button>
                <button
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-semibold text-sm"
                  data-testid="delete-contact"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Contact Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Person Contact Info */}
              {isPerson && (
                <>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-[#0A66C2] transition-colors"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:text-[#0A66C2] transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.role && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span>{contact.role}</span>
                    </div>
                  )}
                  {contact.business && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <button
                        onClick={() =>
                          router.push(`/app/${workspace_id}/contacts/${contact.business?.id}`)
                        }
                        className="hover:text-[#0A66C2] transition-colors font-medium"
                      >
                        {contact.business.name}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Business Contact Info */}
              {isBusiness && (
                <>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:text-[#0A66C2] transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#0A66C2] transition-colors"
                      >
                        {contact.website}
                      </a>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start gap-2 text-gray-700 sm:col-span-2">
                      <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span>{contact.address}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-1 md:col-span-8">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {isBusiness ? "About" : "Additional Details"}
              </h2>
              <div className="flex flex-col gap-4">
                {isPerson && contact.businessId && (
                  <p className="text-gray-900">
                    <strong>Business ID:</strong> {contact.businessId}
                  </p>
                )}
                {isBusiness && contact.taxId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tax ID</p>
                    <p className="text-gray-900 font-medium">{contact.taxId}</p>
                  </div>
                )}
                {contact.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700 leading-relaxed">{contact.notes}</p>
                  </div>
                )}
                {!contact.notes &&
                  !(isBusiness && contact.taxId) &&
                  !(isPerson && contact.businessId) && (
                    <p className="text-sm text-gray-500 italic">No additional details available.</p>
                  )}
              </div>
            </div>

            {/* Business Information for Person */}
            {isPerson && contact.business && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Associated Business</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <button
                      className="text-[#0A66C2] hover:underline font-medium"
                      onClick={() =>
                        router.push(`/app/${workspace_id}/contacts/${contact.business?.id}`)
                      }
                    >
                      {contact.business.name}
                    </button>
                  </div>
                  {contact.business.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="text-gray-900 font-medium">{contact.business.phone}</p>
                    </div>
                  )}
                  {contact.business.website && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Website</p>
                      <a
                        href={contact.business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A66C2] hover:underline font-medium"
                      >
                        {contact.business.website}
                      </a>
                    </div>
                  )}
                  {contact.business.address && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="text-gray-900 font-medium">{contact.business.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colleagues for Person */}
            {isPerson &&
              contact.business &&
              contact.business.employees &&
              contact.business.employees.items.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Colleagues at {contact.business.name}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contact.business.employees.items
                      .filter((colleague) => colleague.id !== contact.id)
                      .map((colleague) => (
                        <button
                          key={colleague.id}
                          onClick={() =>
                            router.push(`/app/${workspace_id}/contacts/${colleague.id}`)
                          }
                          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#0A66C2] hover:shadow-md transition-all text-left group"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                            {colleague.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 group-hover:text-[#0A66C2] transition-colors truncate">
                              {colleague.name}
                            </p>
                            {colleague.role && (
                              <p className="text-sm text-gray-600 truncate flex items-center gap-1 mt-1">
                                <Briefcase className="w-3 h-3" />
                                {colleague.role}
                              </p>
                            )}
                            {colleague.email && (
                              <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                                <Mail className="w-3 h-3" />
                                {colleague.email}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* Employees List for Business */}
            {isBusiness && contact.employees && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Employees
                    <span className="text-sm text-gray-500 font-normal">
                      ({contact.employees.items.length})
                    </span>
                  </h2>
                  <button
                    className="px-4 py-2 text-[#0A66C2] hover:bg-blue-50 rounded-lg transition-colors font-semibold text-sm"
                    onClick={() =>
                      router.push(
                        `/app/${workspace_id}/contacts/create-employee?businessId=${contact.id}`,
                      )
                    }
                  >
                    + Add Employee
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contact.employees.items.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No employees added yet.</p>
                  ) : (
                    contact.employees.items.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => router.push(`/app/${workspace_id}/contacts/${employee.id}`)}
                        className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#0A66C2] hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 group-hover:text-[#0A66C2] transition-colors truncate">
                            {employee.name}
                          </p>
                          {employee.role && (
                            <p className="text-sm text-gray-600 truncate flex items-center gap-1 mt-1">
                              <Briefcase className="w-3 h-3" />
                              {employee.role}
                            </p>
                          )}
                          {employee.email && (
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {employee.email}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Reference Numbers Section - only for Business contacts */}
            {isBusiness && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <ReferenceNumbersSection businessContactId={contact.id} />
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <NotesSection entityId={contact.id} workspaceId={workspace_id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 md:col-span-4">
            {/* Metadata Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {isBusiness ? "Business Info" : "Contact Info"}
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">ID</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{contact.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {isPerson ? "Person" : "Business"}
                  </p>
                </div>
                {isPerson && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-sm text-gray-900 font-medium">{contact.email || "—"}</p>
                  </div>
                )}
                {"createdAt" in contact && contact.createdAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created At</p>
                    <p className="text-sm text-gray-900">{formatDate(contact.createdAt)}</p>
                  </div>
                )}
                {"updatedAt" in contact && contact.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Updated At</p>
                    <p className="text-sm text-gray-900">{formatDate(contact.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Map - only for Business contacts with address */}
            {isBusiness && contact.address && (
              <BusinessLocationMap businessName={contact.name} address={contact.address} />
            )}

            {/* Reporting Designation Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reporting Designation</h2>
              <ResourceMapSearchSelector
                readonly={true}
                onSelectionChange={() => {}}
                selectedIds={isPerson && contact.resourceMapIds ? contact.resourceMapIds : []}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Create Project
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  View All Contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteContact({ variables: { id: contact?.id || "" } });
            setDeleteDialogOpen(false);
            router.push(`/app/${workspace_id}/contacts`);
          } catch (err) {
            setDeleting(false);
            alert("Failed to delete contact.");
          }
        }}
        deleting={deleting}
      />
    </div>
  );
}

// Delete confirmation dialog component
function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Contact</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this contact? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
