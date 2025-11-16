// src/components/admin/SetMenuForm.jsx
import React from "react";
import { Form, Button } from "react-bootstrap";
import Select from "react-select";

export default function SetMenuForm({
                                        modalData,
                                        setModalData,
                                        branches,
                                        categories,
                                        foods,
                                        mealTypes,
                                        errors,
                                        handleChange,
                                        handleFoodsSelect,
                                        mapSelected,
                                        toggleChangeableFood,
                                        handleExchangePriceChange,
                                        imagePreview,
                                        setImagePreview,
                                        isEdit,
                                        handleRemoveOldImage
                                    }) {
    const foodOptions = foods.map(f => ({ value: f.id, label: f.name || `Food #${f.id}`, price: f.price }));

    const getImageUrl = (img) => `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/storage/${img}`;

    const getFoodName = (id) => {
        // Look in foods array first
        const f = foods.find(f => f.id === id);
        if (f?.name) return f.name;
        // Fallback to modalData.food_names
        const nameFromData = modalData.food_names?.find(f => f.id === id)?.name;
        if (nameFromData) return nameFromData;
        return `Food #${id}`;
    };

    return (
        <>
            {/* Branch */}
            <Form.Group className="mb-3">
                <Form.Label>Branch</Form.Label>
                <Form.Select
                    value={modalData.branch_id}
                    onChange={(e) => setModalData(prev => ({ ...prev, branch_id: e.target.value }))}
                    isInvalid={!!errors.branch_id}
                >
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.branch_id?.[0]}</Form.Control.Feedback>
            </Form.Group>

            {/* Meal Type */}
            <Form.Group className="mb-3">
                <Form.Label>Meal Type</Form.Label>
                <Form.Select
                    value={modalData.meal_type || ""}
                    onChange={(e) => setModalData(prev => ({ ...prev, meal_type: e.target.value }))}
                    isInvalid={!!errors.meal_type}
                >
                    <option value="">Select Meal Type</option>
                    {mealTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.meal_type?.[0]}</Form.Control.Feedback>
            </Form.Group>

            {/* Category */}
            <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                    value={modalData.category_id}
                    onChange={(e) => setModalData(prev => ({ ...prev, category_id: e.target.value }))}
                    isInvalid={!!errors.category_id}
                >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.category_id?.[0]}</Form.Control.Feedback>
            </Form.Group>

            {/* Title */}
            <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                    name="title"
                    value={modalData.title || ""}
                    onChange={handleChange}
                    isInvalid={!!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.[0]}</Form.Control.Feedback>
            </Form.Group>

            {/* Japanese Title */}
            <Form.Group className="mb-3">
                <Form.Label>Japanese Title</Form.Label>
                <Form.Control
                    name="japanese_title"
                    value={modalData.japanese_title || ""}
                    onChange={handleChange}
                />
            </Form.Group>

            {/* Foods */}
            <Form.Group className="mb-3">
                <Form.Label>Foods (select multiple)</Form.Label>
                <Select
                    isMulti
                    options={foodOptions}
                    value={mapSelected(modalData.foods_item)}
                    onChange={handleFoodsSelect}
                    placeholder="Select food items..."
                />
                {errors.foods_item && <div className="text-danger mt-1">{errors.foods_item?.[0]}</div>}
            </Form.Group>

            {/* Cost */}
            <div className="d-flex gap-3 mb-3">
                <Form.Group style={{ flex: 1 }}>
                    <Form.Label>Calculated Cost</Form.Label>
                    <Form.Control readOnly value={modalData.calculated_cost ?? 0} />
                </Form.Group>
                <Form.Group style={{ flex: 1 }}>
                    <Form.Label>Cost (sell price)</Form.Label>
                    <Form.Control
                        name="cost"
                        value={modalData.cost || ""}
                        onChange={handleChange}
                        isInvalid={!!errors.cost}
                    />
                    <Form.Control.Feedback type="invalid">{errors.cost?.[0]}</Form.Control.Feedback>
                </Form.Group>
            </div>

            {/* Is Available */}
            <Form.Group className="mb-3">
                <Form.Check
                    type="checkbox"
                    label="Is Available"
                    name="is_available"
                    checked={modalData.is_available}
                    onChange={handleChange}
                />
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={modalData.description || ""}
                    onChange={handleChange}
                />
            </Form.Group>

            {/* Japanese Details */}
            <Form.Group className="mb-3">
                <Form.Label>Japanese Description</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    name="japanese_details"
                    value={modalData.japanese_details || ""}
                    onChange={handleChange}
                />
            </Form.Group>

            {/* Images */}
            <Form.Group className="mb-3">
                <Form.Label>New Images</Form.Label>
                <Form.Control type="file" name="images" multiple onChange={handleChange} />

                {imagePreview.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap">
                        {imagePreview.map((src, idx) => (
                            <div key={idx} className="position-relative me-2 mb-2">
                                <img src={src} width="80" className="rounded border" />
                                <Button
                                    size="sm"
                                    variant="danger"
                                    className="position-absolute top-0 end-0 p-1"
                                    onClick={() => {
                                        setModalData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
                                        setImagePreview(prev => prev.filter((_, i) => i !== idx));
                                    }}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {isEdit && modalData.old_images?.length > 0 && (
                    <>
                        <Form.Label className="mt-2">Existing Images</Form.Label>
                        <div className="d-flex flex-wrap">
                            {modalData.old_images.map((img, idx) => (
                                <div key={idx} className="position-relative me-2 mb-2">
                                    <img src={getImageUrl(img)} width="80" className="rounded border" />
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        className="position-absolute top-0 end-0 p-1"
                                        onClick={() => handleRemoveOldImage(idx)}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Form.Group>
        </>
    );
}
