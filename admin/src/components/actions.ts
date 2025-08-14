import {
  GET_DATA,
  GET_DATA_SUCCEEDED,
  ON_CHANGE_LIST_HEADERS,
  ON_RESET_LIST_HEADERS,
  RESET_PROPS,
  SET_LIST_LAYOUT,
} from '../constants';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface ContentTypeLayout {
  layouts: {
    list: string[];
  };
  [key: string]: any; // fallback for extra fields
}

export interface SetLayoutPayload {
  components: any[];
  contentType: ContentTypeLayout;
}

export const getData = () => ({
  type: GET_DATA as typeof GET_DATA,
});

export const getDataSucceeded = (pagination: Pagination, data: any[]) => ({
  type: GET_DATA_SUCCEEDED as typeof GET_DATA_SUCCEEDED,
  pagination,
  data,
});

export const onResetListHeaders = () => ({
  type: ON_RESET_LIST_HEADERS as typeof ON_RESET_LIST_HEADERS,
});

export const resetProps = () => ({
  type: RESET_PROPS as typeof RESET_PROPS,
});

export const setLayout = ({ components, contentType }: SetLayoutPayload) => {
  const { layouts } = contentType;

  return {
    type: SET_LIST_LAYOUT as typeof SET_LIST_LAYOUT,
    contentType,
    components,
    displayedHeaders: layouts.list,
  };
};

export const onChangeListHeaders = (target: string[]) => ({
  type: ON_CHANGE_LIST_HEADERS as typeof ON_CHANGE_LIST_HEADERS,
  target,
});
