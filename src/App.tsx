import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const ArtworkTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [first, setFirst] = useState(0);
  const [rows] = useState(12);
  
  // Selection strategy: Store selected IDs only
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectCount, setSelectCount] = useState<number | null>(null);
  
  const overlayRef = useRef<OverlayPanel>(null);

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data: ApiResponse = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage = event.page + 1;
    setCurrentPage(newPage);
    setFirst(event.first);
  };

  // Get selected rows for current page
  const getSelectedRows = (): Artwork[] => {
    return artworks.filter(artwork => selectedIds.has(artwork.id));
  };

  const onSelectionChange = (e: any) => {
    const newSelection = e.value as Artwork[];
    const newSelectedIds = new Set(selectedIds);

    // Clear selections for current page artworks
    artworks.forEach(artwork => {
      newSelectedIds.delete(artwork.id);
    });

    // Add new selections
    newSelection.forEach(artwork => {
      newSelectedIds.add(artwork.id);
    });

    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    const newSelectedIds = new Set(selectedIds);
    artworks.forEach(artwork => {
      newSelectedIds.add(artwork.id);
    });
    setSelectedIds(newSelectedIds);
  };

  const handleDeselectAll = () => {
    const newSelectedIds = new Set(selectedIds);
    artworks.forEach(artwork => {
      newSelectedIds.delete(artwork.id);
    });
    setSelectedIds(newSelectedIds);
  };

  const handleCustomSelection = () => {
    if (!selectCount || selectCount <= 0) {
      alert('Please enter a valid number');
      return;
    }

    // Clear all previous selections and select first N rows on current page
    const newSelectedIds = new Set<number>();
    const count = Math.min(selectCount, artworks.length);
    
    for (let i = 0; i < count; i++) {
      newSelectedIds.add(artworks[i].id);
    }

    setSelectedIds(newSelectedIds);
    setSelectCount(null);
    overlayRef.current?.hide();
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button 
          label="Select All" 
          onClick={handleSelectAll}
          size="small"
          outlined
        />
        <Button 
          label="Deselect All" 
          onClick={handleDeselectAll}
          size="small"
          outlined
        />
        <Button 
          label="Custom Select" 
          onClick={(e) => overlayRef.current?.toggle(e)}
          size="small"
          outlined
        />
        <OverlayPanel ref={overlayRef}>
          <div style={{ padding: '10px' }}>
            <label htmlFor="selectCount" style={{ display: 'block', marginBottom: '8px' }}>
              Select number of rows:
            </label>
            <InputNumber
              id="selectCount"
              value={selectCount}
              onValueChange={(e) => setSelectCount(e.value ?? null)}
              placeholder="Enter number"
              style={{ marginBottom: '10px', width: '100%' }}
            />
            <Button 
              label="Submit" 
              onClick={handleCustomSelection}
              size="small"
              style={{ width: '100%' }}
            />
          </div>
        </OverlayPanel>
      </div>
      <div>
        Selected: {selectedIds.size}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>Art Institute of Chicago - Artworks</h1>
      <DataTable
        value={artworks}
        loading={loading}
        selection={getSelectedRows()}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: '60rem' }}
        selectionMode="multiple"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
        <Column field="title" header="Title" style={{ minWidth: '200px' }} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" style={{ minWidth: '200px' }} />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
      <Paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      />
    </div>
  );
};

export default ArtworkTable;
