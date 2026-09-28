create index print_jobs_pdf_asset_id_idx
  on public.print_jobs (pdf_asset_id)
  where pdf_asset_id is not null;

create index print_jobs_preview_asset_id_idx
  on public.print_jobs (preview_asset_id)
  where preview_asset_id is not null;
