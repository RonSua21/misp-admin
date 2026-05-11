import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function ApplicationsLoading() {
  return <TablePageSkeleton rows={10} cols={6} showFilters />;
}
