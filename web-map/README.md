# AI4Autism Map Website

Website tĩnh để xem nhanh các trung tâm can thiệp, giáo dục hòa nhập và trường chuyên biệt từ file Excel dữ liệu AI4Autism.

## Cách mở

Mở file `index.html` trong trình duyệt.

Nền bản đồ dùng OpenStreetMap qua Leaflet CDN, nên cần internet để tải tile bản đồ. Dữ liệu địa điểm nằm local trong `data.js`.

## Cập nhật dữ liệu

Sau khi chỉnh file Excel `AI4Autism-map-data-Vietnam-expanded-83-GPS-import.xlsx`, chạy:

```powershell
$env:PYTHONIOENCODING='utf-8'
& 'C:\Users\tube0\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' web-map\generate_data.py
```

Script sẽ tạo lại `web-map/data.js` từ tab `Tất cả`.

## Trạng thái dữ liệu

- `Ready`: có GPS và nguồn tương đối ổn để import/xem thử.
- `Need verify`: có thể import để rà soát, nhưng cần kiểm tra nguồn hoặc marker trước khi công khai.
- `Duplicate risk`: dành cho dòng nghi trùng, hiện chưa có.
