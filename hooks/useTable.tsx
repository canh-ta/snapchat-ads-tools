/* eslint-disable react/jsx-key */
import themes from '@configs/theme';
import { ClassAttributes, HTMLAttributes, HTMLProps, useEffect, useRef } from 'react';
import { useTable as useReactTable, useRowSelect, useSortBy, usePagination, Column, Hooks } from 'react-table';

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [indeterminate, rest.checked]);

  return <input type="checkbox" ref={ref} className={className + ' cursor-pointer'} {...rest} />;
}

const pageSizeOptions = [10, 20, 50, 100];

function useTable<T extends object>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
  const selectHook = (hooks: Hooks<T>) => {
    hooks.visibleColumns.push((columns) => [
      {
        id: 'selection',
        Header: ({ getToggleAllRowsSelectedProps }: any) => (
          <div className="flex justify-center">
            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
          </div>
        ),
        Cell: ({ row }: any) => (
          <div className="flex justify-center">
            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
          </div>
        ),
      },
      ...columns,
    ]);
  };

  const tableInstance = useReactTable({ columns, data }, useSortBy, usePagination, useRowSelect, selectHook) as any;

  const {
    page,
    canNextPage,
    canPreviousPage,
    getTableProps,
    getTableBodyProps,
    gotoPage,
    headerGroups,
    nextPage,
    prepareRow,
    pageOptions,
    previousPage,
    setPageSize,
    selectedFlatRows,
    state: { selectedRowIds, pageIndex, pageSize },
  } = tableInstance;

  return {
    selectedFlatRows: selectedFlatRows.map((d: { original: any }) => d.original),
    selectedRowIds,
    renderTable: () => (
      <div className="w-full">
        <table className="w-full" {...getTableProps()}>
          <thead>
            {headerGroups.map(
              (headerGroup: {
                getHeaderGroupProps: () => JSX.IntrinsicAttributes &
                  ClassAttributes<HTMLTableRowElement> &
                  HTMLAttributes<HTMLTableRowElement>;
                headers: any[];
              }) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column: any) => (
                    <th
                      className="border p-1 text-sm bg-stone-300"
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                    >
                      {column.render('Header')}
                      <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                    </th>
                  ))}
                </tr>
              ),
            )}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row: any) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell: any) => {
                    return (
                      <td className="border px-2 py-1 text-sm" {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-2 flex justify-between items-center bg-stone-300">
          <div className="flex items-center gap-2">
            <button className={themes.button.default} onClick={() => previousPage()} disabled={!canPreviousPage}>
              Previous Page
            </button>
            <button className={themes.button.default} onClick={() => nextPage()} disabled={!canNextPage}>
              Next Page
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Page</span>
            <input
              type="number"
              defaultValue={pageIndex + 1 || 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
            />
            <span>{`of ${pageOptions.length}`}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
              }}
            >
              {pageSizeOptions.map((pageSize: number) => (
                <option key={pageSize} value={pageSize}>
                  {`Show ${pageSize} items`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    ),
  };
}

export default useTable;
