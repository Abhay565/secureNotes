import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotes = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("User fetch error:", userError.message);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch notes error:", error.message);
    } else {
      setNotes(data);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchNotes);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const handleMenu = (item) => {
    Alert.alert(
      "Note Options",
      "Choose an action",
      [
        { text: "View", onPress: () => console.log("View", item.id) },
        { text: "Edit", onPress: () => console.log("Edit", item.id) },
        {
          text: "Delete",
          onPress: () => handleDelete(item.id),
          style: "destructive",
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      Alert.alert("Error", "Failed to delete note.");
    } else {
      fetchNotes();
    }
  };

 const renderNote = ({ item }) => (
  <View style={styles.noteRowContainer}>
    <Icon name="circle" size={10} color="#333" style={styles.dotIcon} />
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteText}>{item.content}</Text>
        <TouchableOpacity onPress={() => handleMenu(item)}>
          <Icon name="dots-vertical" size={22} color="#777" />
        </TouchableOpacity>
      </View>
      <Text style={styles.timestamp}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  </View>
);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.heading}>Your Notes</Text>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No notes found. Add one from the Home screen.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  list: {
    paddingBottom: 20,
    paddingHorizontal: 20, // Apply horizontal padding here instead of container
  },
  noteRowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 12,
  },
  dotIcon: {
    marginTop: 14,
    // marginRight: 8,
  },
  noteCard: {
    flex: 1, // ensures it doesn’t overflow
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  noteText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    paddingRight: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 10,
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
    color: "#aaa",
    fontSize: 16,
  },
});

