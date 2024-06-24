import React, { useState, useEffect, Fragment, useRef } from 'react';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const DataTableComponent = () => {
    const [data, setData] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const fileInputRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false); // Import modal state
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); // Update modal state
    const [filterText, setFilterText] = useState('');
    const [formData, setFormData] = useState({}); // Form data for update
    const [insertFormData, setInsertFormData] = useState({}); // Form data for update
    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false); // Update modal state
    

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/data');
            console.log('Fetched Data:', response.data);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const columns = [
        { name: 'Tanggal Input', selector: row => format(new Date(row.tanggal_isi), 'dd-MM-yyyy'), sortable: true, width: '140px' },
        { name: 'Nomer JO', selector: row => row.no_jo, sortable: true, width: '160px' },
        { name: 'Nomer WO', selector: row => row.no_wo, sortable: true, width: '140px' },
        { name: 'Nama Project', selector: row => row.nama_project },
        { name: 'Nama Panel', selector: row => row.nama_panel,  },
        {
            name: 'Aksi',
            cell: row => (
                <div>
                    <button
                        onClick={() => handleUpdate(row)}
                        className="mr-2 p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        Update
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '150px'
        }
    ];

    const handleRowClick = row => {
        setSelectedRow(row);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRow(null);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, "konsesi.xlsx");
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

            // Convert parsed dates to MySQL compatible format
            const formattedData = json.map(row => {
                if (row['Tanggal Input']) {
                    row['Tanggal Input'] = formatDateForMySQL(row['Tanggal Input']);
                }
                // Convert other date fields similarly if needed
                return row;
            });

            setExcelData(formattedData);
        };

        reader.readAsBinaryString(file);
    };

    const formatDateForMySQL = (excelDate) => {
        const date = new Date(excelDate);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JavaScript
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleUploadToServer = () => {
        axios.post('http://localhost:5000/upload', { data: excelData })
            .then(response => {
                console.log('Data successfully uploaded:', response.data);
                setIsOpen(false); // Close modal after upload
                alert('Data Berhasil Diimpor');
                fetchData(); // Refresh data after upload
            })
            .catch(error => {
                console.error('There was an error uploading the data:', error);
            });
    };

    const filteredData = data.filter(item =>
        item.no_jo.toLowerCase().includes(filterText.toLowerCase()) ||
        item.nama_project.toLowerCase().includes(filterText.toLowerCase()) ||
        item.nama_panel.toLowerCase().includes(filterText.toLowerCase()) ||
        format(new Date(item.tanggal_isi), 'dd-MM-yyyy').includes(filterText)
    );

    const handleUpdate = (row) => {
        setFormData(row); // Pre-fill form with selected row data
        setIsUpdateModalOpen(true); // Open the update modal
    };

    const closeUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setFormData({}); // Clear form data
    };

    const closeInsertModal = () => {
        setIsInsertModalOpen(false);
        setFormData({}); // Clear form data
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`http://localhost:5000/api/data/${formData.id}`, formData);
            console.log('Data successfully updated:', response.data);
            setIsUpdateModalOpen(false);
            alert('Data Update Sukses');
            fetchData(); // Refresh data after update

        } catch (error) {
            console.error('There was an error updating the data:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleInsertFormChange = (e) => {
        const { name, value } = e.target;
        setInsertFormData({
            ...insertFormData,
            [name]: value
        });
    };

    const handleInsertFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/konsesi', insertFormData);
            console.log('Data successfully inserted:', response.data);
            setIsInsertModalOpen(false);
            alert('Data Berhasil Ditambahkan');
            fetchData(); // Refresh data after insert
            setInsertFormData({}); // Clear insert form data
        } catch (error) {
            console.error('There was an error inserting the data:', error);
        }
    };

    return (
        <div>
            <p style={{ float: 'left', marginBottom: '12px' }} className='m-2'>Search</p>
            <input type='text' placeholder='' className='border-2 m-2' onChange={e => setFilterText(e.target.value)} value={filterText} />
            <button onClick={() => setIsOpen(true)} style={{ float: 'right', marginBottom: '12px', marginLeft: '8px' }} className='rounded w-36 p-2 bg-blue-600 font-semibold text-white hover:bg-blue-700'>Import</button>
            {isOpen && (
                <Dialog
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
                >
                    <div className="relative w-full max-w-md p-4 mx-auto bg-white rounded-lg shadow-lg">
                        <Dialog.Title className="text-lg font-semibold">Import Excel File</Dialog.Title>
                        <Dialog.Description className="mt-2 mb-4">
                            Select an Excel file to upload data to the database.
                        </Dialog.Description>

                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                            className="block w-full p-2 mb-4 border border-gray-300 rounded"
                        />

                        <button
                            onClick={handleUploadToServer}
                            disabled={!excelData.length}
                            className='w-full p-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 rounded'
                        >
                            Upload to Server
                        </button>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                        >
                            &times;
                        </button>
                    </div>
                </Dialog>
            )}
            <button onClick={exportToExcel} style={{ float: 'right', marginBottom: '12px' }} className='rounded w-36 p-2 font-semibold text-white bg-blue-600 hover:bg-blue-700'>Export</button>
            <button onClick={()=>{setIsInsertModalOpen(true)}} style={{ float: 'right', marginBottom: '12px', marginRight: '8px' }} className='rounded w-36 p-2 font-semibold text-white bg-blue-600 hover:bg-blue-700'>Insert</button>
            <DataTable
                columns={columns}
                data={filteredData}
                pagination
                onRowClicked={handleRowClick}
                highlightOnHover
            />

            {isModalOpen && (
                <Transition appear show={isModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={closeModal}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Detail Konsesi
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p><strong>Tanggal Input:</strong> {selectedRow ? formatDate(selectedRow.tanggal_isi) : ''}</p>
                                            <p><strong>Nomer JO:</strong> {selectedRow ? selectedRow.no_jo : ''}</p>
                                            <p><strong>Nomer WO:</strong> {selectedRow ? selectedRow.no_wo : ''}</p>
                                            <p><strong>Nama Project:</strong> {selectedRow ? selectedRow.nama_project : ''}</p>
                                            <p><strong>Nama Panel:</strong> {selectedRow ? selectedRow.nama_panel : ''}</p>
                                            <p><strong>Unit:</strong> {selectedRow ? selectedRow.unit : ''}</p>
                                            <p><strong>Jenis:</strong> {selectedRow ? selectedRow.jenis : ''}</p>
                                            <p><strong>Kode Material:</strong> {selectedRow ? selectedRow.kode_material : ''}</p>
                                            <p><strong>Konsesi:</strong> {selectedRow ? selectedRow.konsesi : ''}</p>
                                            <p><strong>Jumlah Konsesi:</strong> {selectedRow ? selectedRow.jml_konsesi : ''}</p>
                                            <p><strong>Nomor LKPJ:</strong> {selectedRow ? selectedRow.no_lkpj : ''}</p>
                                            <p><strong>Tanggal Material Diterima:</strong> {selectedRow ? formatDate(selectedRow.tgl_material_diterima) : ''}</p>
                                            <p><strong>Jumlah Material Diterima:</strong> {selectedRow ? selectedRow.jml_material_diterima : ''}</p>
                                            <p><strong>No STDL:</strong> {selectedRow ? selectedRow.no_stdl : ''}</p>
                                            <p><strong>Tanggal Pasang:</strong> {selectedRow ? formatDate(selectedRow.tgl_pasang) : ''}</p>
                                            <p><strong>Jumlah Dipasang:</strong> {selectedRow ? selectedRow.jml_dipasang : ''}</p>
                                            
                                            <p><strong>Status:</strong> {selectedRow ? selectedRow.status : ''}</p>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={closeModal}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            )}

            {isUpdateModalOpen && (
                <Transition appear show={isUpdateModalOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={closeUpdateModal}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            Update Data
                                        </Dialog.Title>
                                        <form onSubmit={handleFormSubmit}>
                                            
                                            <div className="mt-2">
                                                <label htmlFor="no_jo" className="block text-sm font-medium text-gray-700">Nomer JO</label>
                                                <input
                                                    type="text"
                                                    name="no_jo"
                                                    value={formData.no_jo}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_wo" className="block text-sm font-medium text-gray-700">Nomer WO</label>
                                                <input
                                                    type="text"
                                                    name="no_wo"
                                                    value={formData.no_wo}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="nama_project" className="block text-sm font-medium text-gray-700">Nama Project</label>
                                                <input
                                                    type="text"
                                                    name="nama_project"
                                                    value={formData.nama_project}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="nama_panel" className="block text-sm font-medium text-gray-700">Nama Panel</label>
                                                <input
                                                    type="text"
                                                    name="nama_panel"
                                                    value={formData.nama_panel}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                                                <input
                                                    type="text"
                                                    name="unit"
                                                    value={formData.unit}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jenis" className="block text-sm font-medium text-gray-700">Jenis</label>
                                                <input
                                                    type="text"
                                                    name="jenis"
                                                    value={formData.jenis}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_lkpj" className="block text-sm font-medium text-gray-700">No. LKPJ</label>
                                                <input
                                                    type="text"
                                                    name="no_lkpj"
                                                    value={formData.no_lkpj}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="kode_material" className="block text-sm font-medium text-gray-700">Kode Material</label>
                                                <input
                                                    type="text"
                                                    name="kode_material"
                                                    value={formData.kode_material}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="konsesi" className="block text-sm font-medium text-gray-700">Konsesi</label>
                                                <input
                                                    type="text"
                                                    name="konsesi"
                                                    value={formData.konsesi}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_konsesi" className="block text-sm font-medium text-gray-700">Jumlah Konsesi</label>
                                                <input
                                                    type="number"
                                                    name="jml_konsesi"
                                                    value={formData.jml_konsesi}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="tgl_material_diterima" className="block text-sm font-medium text-gray-700">Tanggal Material Diterima</label>
                                                <input
                                                    type="date"
                                                    name="tgl_material_diterima"
                                                    value={formData.tgl_material_diterima}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_material_diterima" className="block text-sm font-medium text-gray-700">Jumlah Material Diterima</label>
                                                <input
                                                    type="number"
                                                    name="jml_material_diterima"
                                                    value={formData.jml_material_diterima}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_stdl" className="block text-sm font-medium text-gray-700">No. STDL</label>
                                                <input
                                                    type="text"
                                                    name="no_stdl"
                                                    value={formData.no_stdl}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="tgl_pasang" className="block text-sm font-medium text-gray-700">Tanggal Pasang</label>
                                                <input
                                                    type="date"
                                                    name="tgl_pasang"
                                                    value={formData.tgl_pasang}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_dipasang" className="block text-sm font-medium text-gray-700">Jumlah Dipasang</label>
                                                <input
                                                    type="number"
                                                    name="jml_dipasang"
                                                    value={formData.jml_dipasang}
                                                    onChange={handleFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            

                                            <div className="mt-4">
                                                <button
                                                    type="submit"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ml-2 inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={closeUpdateModal}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            )}

            {isInsertModalOpen && (
                <Transition appear show={isInsertModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeInsertModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Insert Data
                                    </Dialog.Title>
                                    <form onSubmit={handleInsertFormSubmit}>
                                            
                                            <div className="mt-2">
                                                <label htmlFor="no_jo" className="block text-sm font-medium text-gray-700">Nomer JO</label>
                                                <input
                                                    type="text"
                                                    name="no_jo"
                                                    value={insertFormData.no_jo}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_wo" className="block text-sm font-medium text-gray-700">Nomer WO</label>
                                                <input
                                                    type="text"
                                                    name="no_wo"
                                                    value={insertFormData.no_wo}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="nama_project" className="block text-sm font-medium text-gray-700">Nama Project</label>
                                                <input
                                                    type="text"
                                                    name="nama_project"
                                                    value={insertFormData.nama_project}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="nama_panel" className="block text-sm font-medium text-gray-700">Nama Panel</label>
                                                <input
                                                    type="text"
                                                    name="nama_panel"
                                                    value={insertFormData.nama_panel}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                                                <input
                                                    type="text"
                                                    name="unit"
                                                    value={insertFormData.unit}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jenis" className="block text-sm font-medium text-gray-700">Jenis</label>
                                                <input
                                                    type="text"
                                                    name="jenis"
                                                    value={insertFormData.jenis}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_lkpj" className="block text-sm font-medium text-gray-700">No. LKPJ</label>
                                                <input
                                                    type="text"
                                                    name="no_lkpj"
                                                    value={insertFormData.no_lkpj}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="kode_material" className="block text-sm font-medium text-gray-700">Kode Material</label>
                                                <input
                                                    type="text"
                                                    name="kode_material"
                                                    value={insertFormData.kode_material}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="konsesi" className="block text-sm font-medium text-gray-700">Konsesi</label>
                                                <input
                                                    type="text"
                                                    name="konsesi"
                                                    value={insertFormData.konsesi}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_konsesi" className="block text-sm font-medium text-gray-700">Jumlah Konsesi</label>
                                                <input
                                                    type="number"
                                                    name="jml_konsesi"
                                                    value={insertFormData.jml_konsesi}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="tgl_material_diterima" className="block text-sm font-medium text-gray-700">Tanggal Material Diterima</label>
                                                <input
                                                    type="date"
                                                    name="tgl_material_diterima"
                                                    value={insertFormData.tgl_material_diterima}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_material_diterima" className="block text-sm font-medium text-gray-700">Jumlah Material Diterima</label>
                                                <input
                                                    type="number"
                                                    name="jml_material_diterima"
                                                    value={insertFormData.jml_material_diterima}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="no_stdl" className="block text-sm font-medium text-gray-700">No. STDL</label>
                                                <input
                                                    type="number"
                                                    name="no_stdl"
                                                    value={insertFormData.no_stdl}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="tgl_pasang" className="block text-sm font-medium text-gray-700">Tanggal Pasang</label>
                                                <input
                                                    type="date"
                                                    name="tgl_pasang"
                                                    value={insertFormData.tgl_pasang}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <label htmlFor="jml_dipasang" className="block text-sm font-medium text-gray-700">Jumlah Dipasang</label>
                                                <input
                                                    type="number"
                                                    name="jml_dipasang"
                                                    value={insertFormData.jml_dipasang}
                                                    onChange={handleInsertFormChange}
                                                    className="block w-full p-2 mt-1 border border-gray-300 rounded"
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <button
                                                    type="submit"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                >
                                                    Insert
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ml-2 inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={closeUpdateModal}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            )}
        </div>
    );
};

export default DataTableComponent;
