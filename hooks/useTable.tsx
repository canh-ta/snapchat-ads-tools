/* eslint-disable react/jsx-key */
import {
  ClassAttributes,
  HTMLAttributes,
  HTMLProps,
  useEffect,
  useRef,
} from 'react';
import { useTable as useReactTable, useRowSelect, Column } from 'react-table';

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

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  );
}

function useTable<T extends object>({
  columns,
  data,
}: {
  columns: Column<T>[];
  data: T[];
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows,
    state: { selectedRowIds },
  } = useReactTable(
    {
      columns,
      data,
    },
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: 'selection',
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          Header: ({ getToggleAllRowsSelectedProps }: any) => (
            <div>
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }: any) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ]);
    },
  ) as any;

  // Render the UI for your table
  return {
    selectedFlatRows: selectedFlatRows.map(
      (d: { original: any }) => d.original,
    ),
    selectedRowIds,
    renderTable: () => (
      <table {...getTableProps()}>
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
                    className="border p-1 text-sm"
                    {...column.getHeaderProps()}
                  >
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ),
          )}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(
            (row: {
              getRowProps: () => JSX.IntrinsicAttributes &
                ClassAttributes<HTMLTableRowElement> &
                HTMLAttributes<HTMLTableRowElement>;
              cells: any[];
            }) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td
                        className="border px-2 py-1 text-sm"
                        {...cell.getCellProps()}
                      >
                        {cell.render('Cell')}
                      </td>
                    );
                  })}
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    ),
  };
}

export default useTable;
