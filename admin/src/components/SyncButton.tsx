// admin/src/components/SyncButton/index.tsx
import React, { useState, useCallback, useEffect } from 'react';
import  {Button}  from '@strapi/design-system';
import {Download} from '@strapi/icons';
import axiosInstance from '../utils/axiosInstance';
import { useNotification, useQueryParams } from '@strapi/strapi/admin';
import { useLocation } from 'react-router-dom';
import { stringify } from 'qs';
import { getData, getDataSucceeded } from './actions';

const SyncButton = () => {
  const [displaySyncButton, setDisplaySyncButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
 const { toggleNotification } = useNotification(); 
  const { pathname } = useLocation();
  const [{ query }] = useQueryParams();
  const queryParam = `?${stringify(query, { encode: false })}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const path = `/api/strapi-v5-search-multilingual/search/sync-all-entities-types`;
        const response = await axiosInstance.get(path);

        const model = pathname.split('/').pop();
        if (model && response.data.entities?.includes(model)) {
          setDisplaySyncButton(true);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, [pathname]);

  const handleSync = useCallback(async () => {
    try {
      setIsLoading(true);
      const model = pathname.split('/').pop();
      if (!model) return;

      await axiosInstance.get(`/api/strapi-v5-search-multilingual/search/sync-all/?model=${model}`);

      getData();
      const path = `/content-manager/collection-types/${model}${queryParam}`;
      const {
        data: { results, pagination: paginationResult },
      } = await axiosInstance.get(path);

      getDataSucceeded(paginationResult, results);

      toggleNotification({
        type: 'success',
        message: 'Sync completed successfully',
      });

    //window.location.reload();
    } catch (err) {
      toggleNotification({
        type: 'danger',
        message: 'Sync not completed',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pathname, queryParam, toggleNotification]);

  if (!displaySyncButton) return null;


  return (
    <div>
      {displaySyncButton && (
        <Button
          variant="secondary"
          disabled={isLoading}
          loader={isLoading}
          startIcon={<Download />}
          onClick={handleSync}
        >
          Sync with Searches
        </Button>
      )}
    </div>
  );
};

export default SyncButton;
