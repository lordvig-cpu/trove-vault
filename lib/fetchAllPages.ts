interface Page<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/** Continue until empty, even when a server's row cap is below our page size. */
export async function fetchAllPages<T>(fetchPage: (from: number, to: number) => PromiseLike<Page<T>>, signal?: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    signal?.throwIfAborted();
    const { data, error } = await fetchPage(rows.length, rows.length + 999);
    signal?.throwIfAborted();
    if (error) throw new Error(error.message);
    if (!data?.length) return rows;
    rows.push(...data);
  }
}
