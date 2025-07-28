import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    setLoading(true)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("User fetch error:", userError.message);
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch notes error:", error.message);
    } else {
      setNotes(data);
    }
    setLoading(false)
  };

  useEffect(() => {
    fetchNotes();
    const unsubscribe = navigation.addListener("focus", fetchNotes);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      Alert.alert("Error", "Failed to delete note.");
    } else {
      fetchNotes();
    }
  };

  const openEditModal = (note) => {
    setNoteToEdit(note);
    setEditedContent(note.content);
    setIsEditModalVisible(true);
  };

  const handleMenu = (item) => {
    Alert.alert(
      "Note Options",
      "Choose an action",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Edit",
          onPress: () => {
            setNoteToEdit(item);
            setEditedContent(item.content);
            setIsEditModalVisible(true);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(item.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateNote = async () => {
    if (!editedContent.trim()) {
      Alert.alert("Error", "Note content cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("notes")
      .update({
        content: editedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteToEdit.id);

    if (error) {
      Alert.alert("Update Failed", error.message);
    } else {
      setIsEditModalVisible(false);
      setNoteToEdit(null);
      setEditedContent("");
      fetchNotes();
    }
  };

  const handleAddNote = async () => {
    // if (!newNoteContent.trim()) {
    //   Alert.alert("Note cannot be empty.");
    //   return;
    // }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      Alert.alert("Error", userError.message);
      return;
    }

    const { error } = await supabase.from("notes").insert([
      {
        content: newNoteContent.trim(),
        user_id: userData.user.id,
      },
    ]);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setNewNoteContent("");
      setModalVisible(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <LinearGradient
        colors={["#4b6cb7", "#8e44ad"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.statusBarGradient}
      />

      {!loading ? (
        <>
          <Text style={styles.heading}>Your Notes</Text>

          <Modal
            visible={isEditModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setIsEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Edit Note</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedContent}
                  onChangeText={setEditedContent}
                  multiline
                  placeholder="Update your note"
                  placeholderTextColor="#999"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setIsEditModalVisible(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpdateNote}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
                No notes found. Tap + to add one.
              </Text>
            }
          />

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New Note</Text>
                <TextInput
                  placeholder="Enter note content..."
                  value={newNoteContent}
                  onChangeText={setNewNoteContent}
                  style={styles.modalInput}
                  multiline
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCancel}
                  >
                    <Text style={{ color: "#999" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddNote}
                    style={styles.modalSave}
                  >
                    <Text style={{ color: "white" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Floating Add Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.floatingButtonWrapper} // Wrap for positioning
          >
            <LinearGradient
              colors={["#4b6cb7", "#8e44ad"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.floatingButtonGradient}
            >
              <Icon name="plus" size={28} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Optional Logout Button */}
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Logout",
                    style: "destructive",
                    onPress: handleLogout,
                  },
                ],
                { cancelable: true }
              )
            }
            style={styles.logoutBtn}
          >
            <Text style={[styles.linkText, { color: "red" }]}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={40} color={"red"} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 24,
  },
  loadingContainer:{
  flex:1,
  justifyContent: "center",
  alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    elevation: 5,
  },
  statusBarGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 44 : StatusBar.currentHeight, // height for iOS/Android
    zIndex: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    marginRight: 15,
  },
  cancelText: {
    color: "#888",
    fontSize: 16,
  },
  saveButton: {},
  saveText: {
    color: "#4b6cb7",
    fontWeight: "bold",
    fontSize: 16,
  },

  list: {
    paddingBottom: 100,
    // paddingHorizontal: 20,
  },
  noteRowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 12,
  },
  dotIcon: {
    marginTop: 14,
  },
  noteCard: {
    flex: 1,
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
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#4b6cb7",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  logoutBtn: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancel: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modalSave: {
    backgroundColor: "#4b6cb7",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
  },
  floatingButtonWrapper: {
    position: "absolute",
    bottom: 30,
    right: 25,
    borderRadius: 30,
    overflow: "hidden", // So gradient stays rounded
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
