import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useListBusinessContactsQuery } from "../contacts/api";

export type TransactionStep = 0 | 1;

export interface TransactionFormData {
  buyerId?: string;
  productId?: string;
  price?: number;
  rates?: {
    day?: number;
    week?: number;
    month?: number;
  };
  markup?: number;
  quantity?: number;
  deliveryDate?: string;
  daysLeased?: string;
  isOwnershipTransfer?: boolean;
  // service stuff -- TODO separate types depending on the selected product
  serviceDescription: string;
  serviceRate: number;
  billingPeriod: string;
}

const SelectContactStep: React.FC<{
  defaultValues: TransactionFormData;
  onNext: (data: Partial<TransactionFormData>) => void;
  onClose: () => void;
}> = ({ defaultValues, onNext, onClose }) => {
  console.log("SelectContactStep defaultValues: ", defaultValues);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues,
  });

  const onSubmit = (data: TransactionFormData) => {
    console.log("SelectContactStep form data:", data);
    onNext({ buyerId: data.buyerId });
  };

  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { data: businessContacts } = useListBusinessContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: {
        size: 10,
        number: 1,
      },
    },
  });

  const businessOptions = businessContacts?.listContacts?.items.map((contact) => {
    if (contact.__typename === "BusinessContact") {
      return {
        id: contact.id,
        label: contact.name,
        profilePicture: contact.profilePicture,
      };
    }
  });

  return (
    <>
      <Typography variant="subtitle1" fontWeight={600}>
        Add buyer contact
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Complete the fields to record a sale. For ownership transfers, check the box to skip lease
        terms.
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="buyerId"
          control={control}
          rules={{ required: "Business is required" }}
          render={({ field }) => {
            const selectedOption = businessOptions?.find((opt) => opt?.id === field.value) || null;

            return (
              <Autocomplete
                options={businessOptions || []}
                getOptionLabel={(option) => option?.label || ""}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                value={selectedOption}
                onChange={(event, newValue) => {
                  field.onChange(newValue?.id || "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Business"
                    fullWidth
                    required
                    error={!!errors.buyerId}
                    helperText={errors.buyerId?.message}
                  />
                )}
              />
            );
          }}
        />

        <Typography variant="body2" color="text.secondary" mt={1}>
          Use the resource library lookup or{" "}
          <Link href="#" underline="hover">
            +add new contact
          </Link>
        </Typography>

        <Box mt={3} display="flex" justifyContent="space-between" alignItems={"center"}>
          <Typography variant="body2">{`1 of 2`}</Typography>
          <Box display={"flex"} gap={2}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Continue
            </Button>
          </Box>
        </Box>
      </form>
    </>
  );
};

const durationUnits = ["Hour", "Day", "Week"];

export const ProductDetailsStep: React.FC<{
  defaultValues: TransactionFormData;
  onBack: () => void;
  onCreate: () => void;
}> = ({ defaultValues, onBack, onCreate }) => {
  const [productType, setProductType] = useState<"PHYSICAL" | "SERVICE">("PHYSICAL");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues,
  });

  const onSubmit = () => {
    onCreate();
  };

  const renderPhysicalFields = () => (
    <>
      <Grid container spacing={2}>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
          Rental Rates
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 4 }}>
            <TextField label="Day" placeholder="$ 0.00" fullWidth {...register("rates.day")} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField label="Week" placeholder="$ 0.00" fullWidth {...register("rates.week")} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <TextField label="Month" placeholder="$ 0.00" fullWidth {...register("rates.month")} />
          </Grid>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Quantity"
            placeholder="select amount"
            fullWidth
            {...register("quantity")}
          />
        </Grid>

        <Grid size={{ xs: 6 }}>
          <TextField
            label="Delivery date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            {...register("deliveryDate")}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            label="Days leased"
            placeholder="Select days"
            fullWidth
            {...register("daysLeased")}
          />
        </Grid>
      </Grid>

      <FormControlLabel
        control={<Checkbox {...register("isOwnershipTransfer")} />}
        label="Check if selling asset (ownership changes, no lease)"
        sx={{ mt: 2 }}
      />
    </>
  );

  const renderServiceFields = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <TextField
          label="Service Description"
          fullWidth
          placeholder="Describe the service"
          {...register("serviceDescription")}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          label="Hourly Rate"
          placeholder="$ 0.00"
          fullWidth
          {...register("serviceRate")}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          select
          label="Billing Period"
          defaultValue="Hour"
          fullWidth
          {...register("billingPeriod")}
        >
          {durationUnits.map((unit) => (
            <MenuItem key={unit} value={unit}>
              {unit}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );

  return (
    <>
      <Typography variant="subtitle1" fontWeight={600}>
        Add product details
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Complete the fields to record a sale. For ownership transfers, check the box to skip lease
        terms.
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={productType} onChange={(e, val) => setProductType(val)} sx={{ mb: 2 }}>
          <Tab label="Physical Good" value="PHYSICAL" />
          <Tab label="Service Product" value="SERVICE" />
        </Tabs>

        <TextField
          {...register("productId", { required: true })}
          fullWidth
          placeholder="Select product"
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" color="text.secondary" mb={2}>
          Use the resource library lookup to make a selection or{" "}
          <Link href="#" underline="hover">
            Enter known product ID here
          </Link>
        </Typography>

        {productType === "PHYSICAL" ? renderPhysicalFields() : renderServiceFields()}

        <Box mt={3} display="flex" justifyContent="space-between">
          <Typography variant="body2">{`2 of 2`}</Typography>
          <Box display="flex" gap={2}>
            <Button onClick={onBack}>Back</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </Box>
        </Box>
      </form>
    </>
  );
};

export const NewSellTransaction: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState<TransactionStep>(0);
  const [formData, setFormData] = useState<TransactionFormData>({
    buyerId: "",
    productId: "",
    price: 0,
    rates: {
      day: 0,
      week: 0,
      month: 0,
    },
    markup: 0,
    quantity: 0,
    deliveryDate: "",
    daysLeased: "",
    isOwnershipTransfer: false,
    serviceDescription: "",
    serviceRate: 0,
    billingPeriod: "Hour",
  });

  const handleNext = (stepData: Partial<TransactionFormData>) => {
    console.log("Step data:", stepData);
    setFormData((prev) => ({ ...prev, ...stepData }));
    setActiveStep((prev) => (prev + 1) as TransactionStep);
  };

  const handleBack = () => setActiveStep((prev) => (prev - 1) as TransactionStep);

  const handleCreate = async () => {
    console.log("Creating transaction with:", formData);
    // await api call here
    onClose();
  };

  return (
    <Box>
      <Box>
        {activeStep === 0 && (
          <SelectContactStep defaultValues={formData} onNext={handleNext} onClose={onClose} />
        )}
        {activeStep === 1 && (
          <ProductDetailsStep
            defaultValues={formData}
            onBack={handleBack}
            onCreate={handleCreate}
          />
        )}
      </Box>
    </Box>
  );
};
