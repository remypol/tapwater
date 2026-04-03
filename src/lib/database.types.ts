/**
 * Auto-generated Supabase types for TapWater database.
 * Regenerate with: supabase gen types typescript --project-id zxmqmzzwausjradfyttc
 */

export interface Database {
  public: {
    Tables: {
      drinking_water_readings: {
        Row: {
          id: string;
          postcode_district: string | null;
          supplier_id: string | null;
          supply_zone: string | null;
          determinand: string;
          value: number | null;
          unit: string;
          uk_limit: number | null;
          who_guideline: number | null;
          sample_date: string;
          source: string;
          source_ref: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          postcode_district?: string | null;
          supplier_id?: string | null;
          supply_zone?: string | null;
          determinand: string;
          value?: number | null;
          unit: string;
          uk_limit?: number | null;
          who_guideline?: number | null;
          sample_date: string;
          source: string;
          source_ref?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          postcode_district?: string | null;
          supplier_id?: string | null;
          supply_zone?: string | null;
          determinand?: string;
          value?: number | null;
          unit?: string;
          uk_limit?: number | null;
          who_guideline?: number | null;
          sample_date?: string;
          source?: string;
          source_ref?: string | null;
          created_at?: string | null;
        };
      };
      environmental_readings: {
        Row: {
          id: string;
          sampling_point_id: string;
          sampling_point_label: string | null;
          sampling_point_type: string | null;
          latitude: number | null;
          longitude: number | null;
          determinand_id: string;
          determinand_label: string | null;
          value: number | null;
          unit: string | null;
          sample_date: string;
          source_ref: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          sampling_point_id: string;
          sampling_point_label?: string | null;
          sampling_point_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          determinand_id: string;
          determinand_label?: string | null;
          value?: number | null;
          unit?: string | null;
          sample_date: string;
          source_ref?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["environmental_readings"]["Insert"]>;
      };
      filters: {
        Row: {
          id: string;
          brand: string;
          model: string;
          category: string;
          removes: string[];
          certifications: string[] | null;
          price_gbp: number | null;
          affiliate_url: string | null;
          affiliate_program: string | null;
          image_url: string | null;
          rating: number | null;
          active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          brand: string;
          model: string;
          category: string;
          removes: string[];
          certifications?: string[] | null;
          price_gbp?: number | null;
          affiliate_url?: string | null;
          affiliate_program?: string | null;
          image_url?: string | null;
          rating?: number | null;
          active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["filters"]["Insert"]>;
      };
      page_data: {
        Row: {
          postcode_district: string;
          safety_score: number;
          score_grade: string;
          contaminants_tested: number | null;
          contaminants_flagged: number | null;
          pfas_detected: boolean | null;
          pfas_level: number | null;
          pfas_source: string | null;
          top_concerns: unknown | null;
          all_readings: unknown | null;
          environmental_context: unknown | null;
          filter_recommendations: unknown | null;
          summary_text: string | null;
          nearby_postcodes: string[] | null;
          last_data_update: string | null;
          last_page_build: string | null;
          created_at: string | null;
          updated_at: string | null;
          data_source: string | null;
          drinking_water_readings: unknown | null;
          sample_count: number | null;
          date_range_from: string | null;
          date_range_to: string | null;
        };
        Insert: {
          postcode_district: string;
          safety_score: number;
          score_grade: string;
          contaminants_tested?: number | null;
          contaminants_flagged?: number | null;
          pfas_detected?: boolean | null;
          pfas_level?: number | null;
          pfas_source?: string | null;
          top_concerns?: unknown | null;
          all_readings?: unknown | null;
          environmental_context?: unknown | null;
          filter_recommendations?: unknown | null;
          summary_text?: string | null;
          nearby_postcodes?: string[] | null;
          last_data_update?: string | null;
          last_page_build?: string | null;
          data_source?: string | null;
          drinking_water_readings?: unknown | null;
          sample_count?: number | null;
          date_range_from?: string | null;
          date_range_to?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["page_data"]["Insert"]>;
      };
      pipeline_runs: {
        Row: {
          id: string;
          status: string;
          total_postcodes: number;
          processed_postcodes: number | null;
          current_batch: number | null;
          batch_size: number | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          status: string;
          total_postcodes: number;
          processed_postcodes?: number | null;
          current_batch?: number | null;
          batch_size?: number | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_runs"]["Insert"]>;
      };
      postcode_districts: {
        Row: {
          id: string;
          area_name: string;
          city: string | null;
          region: string | null;
          latitude: number;
          longitude: number;
          supplier_id: string | null;
          supply_zone: string | null;
          population_est: number | null;
          has_page: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          area_name: string;
          city?: string | null;
          region?: string | null;
          latitude: number;
          longitude: number;
          supplier_id?: string | null;
          supply_zone?: string | null;
          population_est?: number | null;
          has_page?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["postcode_districts"]["Insert"]>;
      };
      postcode_lsoa: {
        Row: {
          postcode: string;
          lsoa_code: string;
          lsoa_name: string | null;
        };
        Insert: {
          postcode: string;
          lsoa_code: string;
          lsoa_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["postcode_lsoa"]["Insert"]>;
      };
      scrape_log: {
        Row: {
          id: string;
          source: string;
          status: string;
          records_fetched: number | null;
          records_updated: number | null;
          error_message: string | null;
          duration_ms: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          source: string;
          status: string;
          records_fetched?: number | null;
          records_updated?: number | null;
          error_message?: string | null;
          duration_ms?: number | null;
          started_at: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["scrape_log"]["Insert"]>;
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          postcode_district: string | null;
          verified: boolean | null;
          verification_token: string | null;
          unsubscribed: boolean | null;
          created_at: string | null;
          token_created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          postcode_district?: string | null;
          verified?: boolean | null;
          verification_token?: string | null;
          unsubscribed?: boolean | null;
          created_at?: string | null;
          token_created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Insert"]>;
      };
      water_suppliers: {
        Row: {
          id: string;
          name: string;
          region: string | null;
          customers_m: number | null;
          website: string | null;
          postcode_lookup_url: string | null;
          scraper_type: string | null;
          compliance_rate: number | null;
          last_scraped: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          region?: string | null;
          customers_m?: number | null;
          website?: string | null;
          postcode_lookup_url?: string | null;
          scraper_type?: string | null;
          compliance_rate?: number | null;
          last_scraped?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["water_suppliers"]["Insert"]>;
      };
    };
  };
}
